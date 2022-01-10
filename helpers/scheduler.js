const schedule = require("node-schedule");
const Job = require("../Models/job.model");
const User = require("../Models/User.model");
const aws_email = require("../helpers/aws_email");

const getPendingJobs = async () => {
  return Job.find({ completed: false }).lean();
};

const reschedulePendingJobs = async () => {
  const jobs = await getPendingJobs();
  jobs.forEach((job) => {
    if (job.type === "emailToAll") {
      schedule.scheduleJob(new Date(job.email.date), async () => {
        let users = await User.find({}).select("email -_id").lean();
        users = users.map((user) => user.email);
        aws_email.sendEmail(users, job.email.subject, job.email.html, job.email.imageName);
      });
    }
  });
};

module.exports = {
  reschedulePendingJobs,
};
