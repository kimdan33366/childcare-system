export const PatientRecordController = {

  updateVaccine: (
    vaccines,
    index,
    field,
    value
  ) => {

    const updated = [...vaccines];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    return updated;

  },

};