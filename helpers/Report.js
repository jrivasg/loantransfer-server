const ExcelJS = require("exceljs");

module.exports = {
  createReport: (bid, subbid) => {
    const workbook = configureWorkbook();
    return workbook;
  },
};

const configureWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Loan-transfer.com";
  workbook.lastModifiedBy = "Loan-transfer.com";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();

  // Force workbook calculation on load
  workbook.calcProperties.fullCalcOnLoad = true;
  workbook.views = [
    {
      x: 0,
      y: 0,
      width: 10000,
      height: 20000,
      firstSheet: 0,
      activeTab: 1,
      visibility: "visible",
    },
  ];

  let bidsSheet = workbook.addWorksheet("Pujas", {
    views: [{ state: "frozen", xSplit: 1 }],
  });
  bidsSheet = setCells(bidsSheet);

  const viewrsSheet = workbook.addWorksheet("Asistentes", {
    views: [{ state: "frozen", xSplit: 1 }],
  });

  const notifiedSheet = workbook.addWorksheet("Notificados", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  return workbook;
};

const setCells = (bidsSheet) => {
  bidsSheet.columns = [
    { header: "Id", key: "id", width: 10 },
    { header: "Name", key: "name", width: 32 },
    { header: "D.O.B.", key: "DOB", width: 10 },
  ];
  bidsSheet.addRow({ id: 1, name: "John Doe", dob: new Date(1970, 1, 1) });
  bidsSheet.addRow({ id: 2, name: "Jane Doe", dob: new Date(1965, 1, 7) });
};
