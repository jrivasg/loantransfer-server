const schedule = require("node-schedule");
const Job = require("../Models/job.model");
const Bid = require("../Models/bid.model");
const User = require("../Models/User.model");
const aws_email = require("../helpers/aws_email");

const getPendingJobs = async () => {
  return Job.find({ completed: false }).lean();
};

const reschedulePendingJobs = async () => {
  // Se obtienen todas las tareas que no han sido completadas
  const jobs = await getPendingJobs();
  jobs.forEach((job) => {
    const date = new Date(job.email.date);

    if (job.type === "emailToAll" && date.getTime() > new Date().getTime()) {
      schedule.scheduleJob(date, async () => {
        let users = await User.find({ emailVerified: false }).select("email -_id").lean();
        users = users.map((user) => user.email);

        const toAddresses =
        process.env.NODE_ENV === "production"
          ? "info@loan-transfer.com"
          : "rivas_jose_antonio@hotmail.com";
        const bccAddresses =
        process.env.NODE_ENV === "production"
          ? users
          : null;
        const emailSentInfo = await aws_email.sendEmail({
          toAddresses,
          subject: job.email.subject,
          body_html: job.email.html,          
          bccAddresses
        });

        if (emailSentInfo.accepted.length > 0) {
          console.log("Email recordatorio de cartera enviado");
          Bid.findByIdAndUpdate(
            job.bid_id,
            {
              $set: { "notifications.start": true },
            },
            { new: true },
            (err, bid) => {
              if (err) res.status(500).json(err);
            }
          );
          Job.findByIdAndUpdate(
            job._id,
            {
              completed: true,
            },
            { new: true },
            (err, job) => {
              if (err) res.status(500).json(err);
            }
          );
          // TODO LOG de a quien se ha enviado
        }
      });
      console.log("Tarea recordatorio email programada");
    }
  });
};

module.exports = {
  reschedulePendingJobs,
};
