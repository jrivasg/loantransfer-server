// Configuración de Dayjs
const dayjs = require("dayjs");
const es = require("dayjs/locale/es");
dayjs.locale({ ...es, weekStart: 1 });
const localeData = require("dayjs/plugin/localeData");
dayjs.extend(localeData);
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
dayjs.extend(isSameOrBefore);
const isToday = require('dayjs/plugin/isToday');
dayjs.extend(isToday);
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
dayjs.extend(isSameOrAfter);
const isBetween = require('dayjs/plugin/isBetween')
dayjs.extend(isBetween)
const isLeapYear = require('dayjs/plugin/isLeapYear')
dayjs.extend(isLeapYear)
var isoWeek = require('dayjs/plugin/isoWeek')
dayjs.extend(isoWeek)

const localeInstance = dayjs().localeData();
console.log('Primer dia de la semana', (localeInstance.meridiem()))
module.exports = {
  dayjs,
  now: dayjs().add(2, "h"),
  isSameOrBefore: (firstDate, secondDate) => dayjs(firstDate).isSameOrBefore(secondDate, 'day'),
  isSameOrAfter: (firstDate, secondDate) => dayjs(firstDate).isSameOrAfter(secondDate, 'day'),
  isToday: (date) => dayjs(date).isToday(),
  isBetween: (date, firstDate, secondDate) => dayjs(date).isBetween(firstDate, secondDate, null, '[]'),
  isLeapYear: (date) => dayjs(date).isLeapYear(),
  getDaysBetweenDates: (startDate, endDate) => {
    let now = dayjs(startDate), dates = {};
    const finish = dayjs(endDate);
    while (now.isSameOrBefore(finish)) {
      console.log(now.toISOString())
      dates[now.format('MM/DD/YYYY')] = [];
      now = dayjs(now).add(1, 'day');
    }

    return dates;
  },
  addMinutes: (date, minutes) => dayjs(date).add(minutes, 'm'),
};