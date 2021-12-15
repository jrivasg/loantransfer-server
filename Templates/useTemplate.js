const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

module.exports = {
  getHtmltoSend: (templatePath, keysObject) => {
    const emailTemplateSource = fs.readFileSync(
      path.join(__dirname, templatePath),
      "utf8"
    );
    const template = handlebars.compile(emailTemplateSource);
    return template(keysObject);
  },
};
