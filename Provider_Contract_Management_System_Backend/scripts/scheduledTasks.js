// // scheduledTasks.js
// const cron = require('node-cron');
// const Contract = require('../models/contract');
// const nodemailer = require('nodemailer');

// const sendNotifications = async () => {
//   try {
//     const currentDate = new Date();
//     const threeMonthsFromNow = new Date();
//     threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

//     // Fetch contracts that need notifications
//     const contracts = await Contract.find({
//       $or: [
//         { endDate: { $lte: threeMonthsFromNow, $gt: currentDate }, contractStatus: { $ne: 'expired' } },
//         { endDate: { $lt: currentDate }, contractStatus: { $ne: 'expired' } },
//         { contractStatus: { $in: ['suspended', 'terminated'] } }
//       ]
//     });

//     if (contracts.length === 0) {
//       console.log('No notifications to send today.');
//       return;
//     }

//     // Generate notifications
//     const notifications = contracts.map(contract => {
//       let title, message;
//       if (contract.endDate <= threeMonthsFromNow && contract.endDate > currentDate) {
//         title = 'Contract Due for Renewal';
//         message = `The contract for ${contract.providerName} is due for renewal in 3 months.`;
//       } else if (contract.endDate < currentDate) {
//         title = 'Contract Expired';
//         message = `The contract for ${contract.providerName} has expired.`;
//       } else {
//         title = 'Contract Status Change';
//         message = `The contract for ${contract.providerName} has been ${contract.contractStatus}.`;
//       }
//       return { title, message };
//     });

//     // Configure Nodemailer transporter
//     const transporter = nodemailer.createTransport({
//       host: "smtp-mail.outlook.com",
//       port: 587,
//       secure: false, // Use TLS
//       auth: {
//         user: process.env.OUTLOOK_EMAIL,
//         pass: process.env.OUTLOOK_PASSWORD,
//       },
//     });

//     const notificationEmail = process.env.NOTIFICATION_EMAIL || 'annah.mukethe@ke.cicinsurancegroup.com';

//     // Prepare email content
//     const emailBody = notifications.map(notif => 
//       `${notif.title}\n${notif.message}\n`
//     ).join('\n');

//     // Send email if there are notifications
//     await transporter.sendMail({
//       from: process.env.OUTLOOK_EMAIL,
//       to: notificationEmail,
//       subject: 'Contract Management Notifications',
//       text: `You have the following contract notifications:\n\n${emailBody}`,
//     });

//     console.log(`Notification email sent to ${notificationEmail}`);

//     // Update contract statuses if expired
//     const expiredContracts = contracts.filter(contract => contract.endDate < currentDate && contract.contractStatus !== 'expired');
//     for (const contract of expiredContracts) {
//       contract.contractStatus = 'expired';
//       await contract.save();
//       console.log(`Contract ${contract.contractId} marked as expired.`);
//     }

//   } catch (error) {
//     console.error('Error in sendNotifications:', error);
//   }
// };

// // Schedule the task to run daily at 8:00 AM
// const scheduleNotifications = () => {
//   cron.schedule('0 8 * * *', () => { // Adjust the time as needed
//     console.log('Running scheduled notification task');
//     sendNotifications();
//   });
// };

// module.exports = scheduleNotifications;

// scheduledTasks.js
const cron = require('node-cron');
const Contract = require('../models/contract');
const nodemailer = require('nodemailer');

const sendNotifications = async () => {
  try {
    const currentDate = new Date();
    const threeMonthsFromNow = new Date(currentDate);
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    // Update contract statuses
    await Contract.updateMany(
      { endDate: { $lt: currentDate }, contractStatus: { $ne: 'expired' } },
      { $set: { contractStatus: 'expired' } }
    );

    await Contract.updateMany(
      { endDate: { $lte: threeMonthsFromNow, $gt: currentDate }, contractStatus: { $ne: 'due_for_renewal' } },
      { $set: { contractStatus: 'due_for_renewal' } }
    );

    // Fetch contracts that need notifications
    const contracts = await Contract.find({
      contractStatus: { $in: ['due_for_renewal', 'expired', 'suspended', 'terminated'] }
    });

    if (contracts.length === 0) {
      console.log('No notifications to send today.');
      return;
    }

    // Generate notifications
    const notifications = contracts.map(contract => {
      let title, message;
      switch (contract.contractStatus) {
        case 'due_for_renewal':
          title = 'Contract Due for Renewal';
          message = `The contract for ${contract.providerName} is due for renewal in 3 months.`;
          break;
        case 'expired':
          title = 'Contract Expired';
          message = `The contract for ${contract.providerName} has expired.`;
          break;
        case 'suspended':
          title = 'Contract Suspended';
          message = `The contract for ${contract.providerName} has been suspended.`;
          break;
        case 'terminated':
          title = 'Contract Terminated';
          message = `The contract for ${contract.providerName} has been terminated.`;
          break;
        default:
          title = 'Contract Status Update';
          message = `The contract for ${contract.providerName} has a status update: ${contract.contractStatus}.`;
      }
      return { title, message };
    });

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.OUTLOOK_EMAIL,
        pass: process.env.OUTLOOK_PASSWORD,
      },
    });

    const notificationEmail = process.env.NOTIFICATION_EMAIL || 'annah.mukethe@ke.cicinsurancegroup.com';

    // Prepare email content
    const emailBody = notifications.map(notif => 
      `${notif.title}\n${notif.message}\n`
    ).join('\n');

    // Send email
    await transporter.sendMail({
      from: process.env.OUTLOOK_EMAIL,
      to: notificationEmail,
      subject: 'Contract Management Notifications',
      text: `You have the following contract notifications:\n\n${emailBody}`,
    });

    console.log(`Notification email sent to ${notificationEmail}`);

  } catch (error) {
    console.error('Error in sendNotifications:', error);
  }
};

// Schedule the task to run daily at 8:00 AM
const scheduleNotifications = () => {
  cron.schedule('0 8 * * *', () => {
    console.log('Running scheduled notification task');
    sendNotifications();
  });
};

module.exports = scheduleNotifications;