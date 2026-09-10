export const AppointmentController = {

  search: (appointments, search, dateFilter) => {

    return appointments
      .filter((appointment) =>
        appointment.patient
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .filter((appointment) =>
        dateFilter === "All"
          ? true
          : appointment.date === dateFilter
      );

  },

  add: (appointments, appointment) => {

    return [
      ...appointments,
      {
        ...appointment,
        id: Date.now(),
      },
    ];

  },

  update: (appointments, id, data) => {

    return appointments.map(
      (appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              ...data,
            }
          : appointment
    );

  },

  delete: (appointments, id) => {

    return appointments.filter(
      (appointment) =>
        appointment.id !== id
    );

  },

};