export const PatientController = {

  addPatient: (patients, patient) => {
    return [
      ...patients,
      {
        ...patient,
        id: Date.now(),
        coverage: "0%",
      },
    ];
  },

  searchPatients: (patients, search) => {

    return patients.filter((patient) =>
      patient.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  },

};