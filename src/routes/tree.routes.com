
const title = "General announcement";

const message = "Welcome to Family Diary! We are working very hard to deliver the application before this year runs out. Thank you for being part of our community.";

const eventKey = "announcement:family-diary-our-work-2026-11";

const audienceUserIds = db.users
  .find({}, { _id: 1 })
  .toArray()
  .map(user => user._id);

if (audienceUserIds.length === 0) {
  print("No registered users found. Announcement not created.");
} else {
  const existing = db.notifications.findOne({ eventKey });

  if (existing) {
    print("This announcement has already been published.");
  } else {
    const result = db.notifications.insertOne({
      recipientType: "general",

      family: null,
      user: null,
      sender: null,

      audienceUserIds,

      excludedUsers: [],

      title,
      text: message,

      type: "APP_ANNOUNCEMENT",

      relatedId: null,
      confirmMember: false,

      channels: ["in_app", "socket", "push"],

      eventKey,
      scheduledFor: null,

      createdAt: new Date(),
      updatedAt: new Date()
    });

    print("Announcement published successfully!");
    print("Notification ID: " + result.insertedId);
    print("Total recipients: " + audienceUserIds.length);
  }
}
