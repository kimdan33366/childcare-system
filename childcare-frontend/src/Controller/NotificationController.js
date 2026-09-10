export const NotificationController = {

  createNotification: (
    reminder,
    status = "Reminder Sent"
  ) => {

    return {
      id: Date.now(),
      child: reminder.child,
      status,
      parent: reminder.parent,
      message: reminder.message,
      phone: reminder.phone,
    };

  },

  createBroadcast: (message) => {

    return {
      id: Date.now(),
      child: "All Children",
      status: "Reminder Sent",
      parent: "All Parents",
      message,
      phone: "Broadcast",
    };

  },

};