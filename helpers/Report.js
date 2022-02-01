const ExcelJS = require("exceljs");

module.exports = {
  createReport: (subbid) => {
    const workbook = configureWorkbook(subbid);
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
      activeTab: 0,
      visibility: "visible",
    },
  ];

  let viewrsSheet = workbook.addWorksheet("Asistentes", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });
  viewrsSheet = setViewrsCells(viewrsSheet, subbid);

  let bidsSheet = workbook.addWorksheet("Pujas", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });
  bidsSheet = setBidsCells(bidsSheet, subbid);

  /* let notifiedSheet = workbook.addWorksheet("Notificados", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  }); */

  return workbook;
};

const setBidsCells = (sheet, subbid) => {
  //console.log(subbid.data)
  sheet.columns = [
    { header: "Cliente", key: "client", width: 40 },
    { header: "Empresa", key: "company", width: 20 },
    { header: "Hora", key: "hour", width: 25 },
    { header: "Puja", key: "bid", width: 10 },
  ];

  sheet.getRow(1).font = { size: 12, bold: true };

  subbid.data.forEach(({ displayName, company, amount, time }) => {
    const tempTime = new Date(time);
    tempTime.setHours(
      tempTime.getHours() + 1 + Math.abs(new Date().getTimezoneOffset() / 60)
    );
    sheet.addRow({ client: displayName, company: company, hour: tempTime.toLocaleString("es-ES"), bid: `${amount} €` });
  })
};

const setViewrsCells = (sheet, subbid) => {
  //console.log(subbid.data)
  sheet.columns = [
    { header: "Cliente", key: "client", width: 40 },
    { header: "Empresa", key: "company", width: 20 }
  ];

  sheet.getRow(1).font = { size: 12, bold: true };

  subbid.viewers
    .forEach(({ displayName, company }) => {
      sheet.addRow({ client: displayName, company: company });
    })
};
