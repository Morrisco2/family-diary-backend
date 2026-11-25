
import cron from "node-cron";
import User from "../models/user.model.js";
import Families from "../models/createFamily.model.js";
import NotificationEvent from "../models/notificationEvent.model.js";
import {
  createFamilyNotification,
  createIndividualNotification
} from "./notification.services.js";

const DELIVERY_HOUR = 9;
const LOCK_MS = 4 * 60 * 1000;

const getLocalParts = (date, timezone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  return Object.fromEntries(
    parts.map((p) => [p.type, p.value])
  );
};

const dateKey = (y, m, d) => `${y}-${m}-${d}`;

const birthdayThisYear = (dob, year) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob || "")) {
    return null;
  }

  let [, month, day] = dob.split("-");

  if (month === "02" && day === "29") {
    const leap = new Date(year, 1, 29).getMonth() === 1;

    if (!leap) {
      day = "28";
    }
  }

  return `${month}-${day}`;
};

const getUtcForLocalTime = (
  year,
  month,
  day,
  hour,
  timezone
) => {
  // Resolve a wall-clock time in an IANA timezone
  // without depending on server timezone.

  const target = Date.UTC(
    year,
    Number(month) - 1,
    Number(day),
    hour,
    0,
    0
  );

  let guess = target;

  for (let i = 0; i < 3; i++) {
    const p = getLocalParts(new Date(guess), timezone);

    const represented = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      0
    );

    guess += target - represented;
  }

  return new Date(guess);
};

const ensureEvent = async (event) => {
  try {
    await NotificationEvent.updateOne(
      { eventKey: event.eventKey },
      { $setOnInsert: event },
      { upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }
};

const discoverTodayEvents = async () => {
  const now = new Date();

  const users = await User.find({
    dob: /^\d{4}-\d{2}-\d{2}$/
  })
    .select("_id name dob timezone")
    .lean();

  for (const user of users) {
    const timezone = user.timezone || "UTC";

    let local;

    try {
      local = getLocalParts(now, timezone);
    } catch {
      local = getLocalParts(now, "UTC");
    }

    const today = `${local.month}-${local.day}`;

    const birthday = birthdayThisYear(
      user.dob,
      Number(local.year)
    );

    if (!birthday) continue;

    const birthdayDate = `${local.year}-${birthday}`;

    const reminderDateObj = new Date(
      `${birthdayDate}T00:00:00Z`
    );

    reminderDateObj.setUTCDate(
      reminderDateObj.getUTCDate() - 2
    );

    const reminderDate = dateKey(
      reminderDateObj.getUTCFullYear(),
      String(
        reminderDateObj.getUTCMonth() + 1
      ).padStart(2, "0"),
      String(
        reminderDateObj.getUTCDate()
      ).padStart(2, "0")
    );

    // Discover birthday reminders (two days before birthday).
    if (today === reminderDate.slice(5)) {
      const scheduledFor = getUtcForLocalTime(
        Number(local.year),
        local.month,
        local.day,
        DELIVERY_HOUR,
        timezone
      );

      const families = await Families.find({
        $or: [
          { "leader.id": user._id },
          {
            members: {
              $elemMatch: {
                user: user._id,
                status: "approved"
              }
            }
          }
        ]
      })
        .select("_id")
        .lean();

      for (const family of families) {
        await ensureEvent({
          eventKey: `birthday-reminder:${family._id}:${user._id}:${birthdayDate}`,
          eventType: "BIRTHDAY_REMINDER",
          family: family._id,
          celebrant: user._id,
          scheduledFor
        });
      }
    }

    // Discover birthday messages on the birthday itself.
    if (today === birthday) {
      const scheduledFor = getUtcForLocalTime(
        Number(local.year),
        local.month,
        local.day,
        DELIVERY_HOUR,
        timezone
      );

      await ensureEvent({
        eventKey: `birthday-message:${user._id}:${birthdayDate}`,
        eventType: "BIRTHDAY_MESSAGE",
        celebrant: user._id,
        scheduledFor
      });
    }
  }
};

const processEvents = async () => {
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const event = await NotificationEvent.findOneAndUpdate(
      {
        scheduledFor: { $lte: now },
        $or: [
          { status: "pending" },
          {
            status: "failed",
            attempts: { $lt: 5 }
          },
          {
            status: "processing",
            lockedUntil: { $lt: now }
          }
        ]
      },
      {
        $set: {
          status: "processing",
          lockedUntil: new Date(Date.now() + LOCK_MS),
          lastError: null
        },
        $inc: {
          attempts: 1
        }
      },
      {
        // Replaces deprecated new: true
        returnDocument: "after",
        sort: {
          scheduledFor: 1
        }
      }
    );

    if (!event) break;

    try {
      let notification;

      if (event.eventType === "BIRTHDAY_REMINDER") {
        const celebrant = await User.findById(
          event.celebrant
        )
          .select("name")
          .lean();

        if (!celebrant) {
          throw new Error(
            "Birthday celebrant no longer exists"
          );
        }

        notification = await createFamilyNotification({
          familyId: event.family,
          title: "Birthday Reminder",
          text: `${celebrant.name}'s birthday is in two days. Remember to send your wishes!`,
          type: "BIRTHDAY_REMINDER",
          excludedUsers: [event.celebrant],
          eventKey: event.eventKey
        });

      } else {
        const celebrant = await User.findById(
          event.celebrant
        )
          .select("name")
          .lean();

        if (!celebrant) {
          throw new Error(
            "Birthday celebrant no longer exists"
          );
        }

        notification = await createIndividualNotification({
          userId: event.celebrant,
          title: `Happy Birthday, ${celebrant.name}!`,
          text: `Happy Birthday, ${celebrant.name}! Everyone at Family Diary wishes you a wonderful day and a year filled with happiness, good health, and beautiful memories.`,
          type: "BIRTHDAY_MESSAGE",
          eventKey: event.eventKey
        });
      }

      await NotificationEvent.updateOne(
        { _id: event._id },
        {
          $set: {
            status: "completed",
            notification: notification._id,
            lockedUntil: null
          }
        }
      );

    } catch (error) {
      // Duplicate notification event means a previous
      // attempt persisted it successfully.

      if (error.code === 11000) {
        await NotificationEvent.updateOne(
          { _id: event._id },
          {
            $set: {
              status: "completed",
              lockedUntil: null
            }
          }
        );

      } else {
        await NotificationEvent.updateOne(
          { _id: event._id },
          {
            $set: {
              status: event.attempts >= 5
                ? "failed"
                : "pending",
              lockedUntil: null,
              lastError: error.message
            }
          }
        );
      }
    }
  }
};

export const startBirthdayNotificationScheduler = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      await discoverTodayEvents();
      await processEvents();
    } catch (error) {
      console.error(
        "Birthday notification scheduler error:",
        error
      );
    }
  });

  // Run once immediately after startup.
  discoverTodayEvents()
    .then(processEvents)
    .catch((error) => {
      console.error(
        "Birthday scheduler startup error:",
        error
      );
    });
};
