require("dotenv").config();
const Bid = require("../Models/bid.model");
const User = require("../Models/User.model");
var mongoose = require("mongoose");
const { promisify } = require("util");
const client = require("../helpers/init_redis");
const getAsyncRedis = promisify(client.get).bind(client);
const aws_email = require("../helpers/aws_email");
const { createReport } = require("../helpers/Report");
const { getHtmltoSend } = require("../Templates/useTemplate");
var fs = require("fs");
const DIR = "./uploads/";
const path = require("path");

module.exports = {
  getAll: async (req, res, next) => {
    try {
      //console.log(req.payload);
      const bid = await Bid.find().lean();
      bid.sort(compare);
      res.status(200).json(bid);
    } catch (error) {
      next(error);
    }
  },

  getMybids: async (req, res, next) => {
    try {
      const { user_id } = req.body;
      //console.log(req.payload);
      const bid = await Bid.find({ final_buyer: user_id }).lean();
      bid.sort(compare);
      res.status(200).json(bid);
    } catch (error) {
      next(error);
    }
  },

  getActiveBids: async (req, res, next) => {
    let today = new Date();
    let yesterday = new Date();
    let endTime = new Date();
    yesterday.setHours(today.getHours() - 8);
    endTime.setDate(today.getDate() + 14);

    try {
      //console.log(req.payload);
      const bid = await Bid.find({
        starting_time: { $gte: yesterday, $lte: endTime },
        finish: false,
      }).lean();

      bid.sort(compare);
      bid.reverse();
      res.status(200).json({ bid, now: new Date() });
    } catch (error) {
      next(error);
    }
  },

  getOneSubbid: async (req, res, next) => {
    const { bid_id, subbid_id } = req.body;
    try {
      const subbid = await getSubbidDetails(bid_id, subbid_id, req.payload.aud);

      //console.log(subbid);
      //res.status(200).json({ subbid, bid });
      res.status(200).json(subbid);
    } catch (error) {
      next(error);
    }
  },

  getOneBid: async (req, res, next) => {
    const { bid_id } = req.body;
    try {
      const bid = await Bid.findById(bid_id).lean();

      res.status(200).json(bid);
    } catch (error) {
      next(error);
    }
  },

  getInfo: async (req, res, next) => {
    try {
      const users = await User.find().lean();
      const _id = new mongoose.Types.ObjectId();

      client.SET(
        `bidCreationObject-${req.payload.aud}`,
        JSON.stringify({ id: _id }),
        (err, reply) => {
          if (err) console.log(err.message);
        }
      );
      res.status(200).json({
        users,
        _id,
      });
    } catch (error) {
      next(error);
    }
  },

  getsubbidid: async (req, res, next) => {
    console.log(req.payload.aud);
    try {
      const subbid_id = new mongoose.Types.ObjectId();
      const bidCreationObject = JSON.parse(
        await getAsyncRedis(`bidCreationObject-${req.payload.aud}`).catch(
          (err) => console.error(err)
        )
      );
      // Comprobamos si hay algun objeto de lote vacio, quiere decir que ese
      // lote no se ha seguido creando y lo borramos antes de a??adir un nuevo lote
      removeEmptyObjects(bidCreationObject);
      // Se  a??ade al array de ids el nuevo id creado para el lote y se crea su objeto
      (bidCreationObject.subbids= bidCreationObject.subbids || []).push(subbid_id);
      bidCreationObject[subbid_id] = {};
      //console.log('bidCreationObject', bidCreationObject)
      client.SET(
        `bidCreationObject-${req.payload.aud}`,
        JSON.stringify(bidCreationObject),
        (err, reply) => {
          if (err) console.log(err.message);
        }
      );
      res.status(200).json({
        subbid_id,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  getReport: async (req, res, next) => {
    const { bid_id, subbid_id } = req.query;

    try {
      let workbook;

      subbid = await getSubbidDetails(bid_id, subbid_id, req.payload.aud);
      workbook = createReport(subbid);
      const tempath = DIR + subbid_id;
      !fs.existsSync(tempath) && fs.mkdirSync(tempath);

      var filePath = path.join("uploads/" + subbid_id + "/report.xlsx");

      await workbook.xlsx.writeFile("uploads/" + subbid_id + "/report.xlsx");
      var readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  /* createBid: async (req, res, next) => {
    let {
      _id,
      title,
      minimunAmount,
      totalDebt,
      principalMount,
      globalIcons,
      bids,
      seller,
      starting_time,
      end_time,
    } = req.body;

    // Comprobamos que los documentos almacenados en redis coinciden con los lotes llegados al crear la cartera
    // para eliminar archivos subidos innecearios
    const { populatedBids } = populateBidDocuments({ bids, _id });

    const bidExists = await Bid.findById(_id).lean();
    if (bidExists) {
      let docs = bidExists.bids.map((lote) => lote.documents);
      docs = docs.flat();
      bids = bids.map((lote, index) => {
        lote.documents = docs[index];
        return lote;
      });

      Bid.findByIdAndUpdate(
        _id,
        {
          title,
          minimunAmount,
          totalDebt,
          principalMount,
          globalIcons,
          bids,
          seller,
          starting_time,
          end_time,
        },
        { new: true },
        (err, bid) => {
          if (err) res.status(500).json(err);
          initilizeRedisBidObject(bid);

          if (!bid.notifications.created) {
            let jsonBid = JSON.parse(JSON.stringify(bid));
            sendNewBidEmail(jsonBid);
          }
          res.status(200).json(bid);
        }
      );
    } else {
      new Bid({
        _id,
        title,
        seller,
        globalIcons,
        bids,
        starting_time,
        end_time,
      }).save(async (err, bid) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }
        let jsonBid = JSON.parse(JSON.stringify(bid));
        initilizeRedisBidObject(jsonBid);

        sendNewBidEmail(jsonBid);

        res.status(200).json(bid);
      });
    }
  }, */

  createBid: async (req, res, next) => {
    let { _id, title, globalIcons, bids, seller, starting_time, end_time } =
      req.body;

    // Comprobamos que los documentos almacenados en redis coinciden con los lotes llegados al crear la cartera
    // para eliminar archivos subidos innecearios
    const { populatedBids, documents } = await populateBidDocuments({
      user: req.payload.aud,
      bids,
      _id,
    });

    console.log("populatedBids", populatedBids);
    console.log();
    const bidExists = await Bid.findById(_id).lean();
    if (bidExists) {
      /* let docs = bidExists.bids.map((lote) => lote.documents);
      docs = docs.flat();
      bids = bids.map((lote, index) => {
        lote.documents = docs[index];
        return lote;
      }); */

      Bid.findByIdAndUpdate(
        _id,
        {
          title,
          globalIcons,
          bids: populatedBids,
          seller,
          starting_time,
          end_time,
        },
        { new: true },
        (err, bid) => {
          if (err) res.status(500).json(err);
          initilizeRedisBidObject(bid);

          if (!bid.notifications.created) {
            let jsonBid = JSON.parse(JSON.stringify(bid));
            sendNewBidEmail(jsonBid);
          }
          res.status(200).json(bid);
        }
      );
    } else {
      new Bid({
        _id,
        title,
        seller,
        globalIcons,
        bids: populatedBids,
        starting_time,
        end_time,
        documents,
      }).save(async (err, bid) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }
        let jsonBid = JSON.parse(JSON.stringify(bid));
        initilizeRedisBidObject(jsonBid);

        sendNewBidEmail(jsonBid);

        res.status(200).json(bid);
      });
    }
  },

  deleteBid: async (req, res, next) => {
    try {
      Bid.findByIdAndDelete(req.body.bid_id, (err, bid) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }
        res.status(200).json("Subasta borrada");
      });
    } catch (error) {
      console.log(error);
    }
  },
};

const initilizeRedisBidObject = (bid) => {
  bid.bids.forEach(({ minimunAmount, _id, seller }) => {
    const puja = [
      {
        from: null,
        time: new Date(),
        bid_id: bid._id,
        amount: minimunAmount,
        subbid_id: _id,
        active: false,
        finish: false,
        endTime: new Date(bid.end_time),
      },
    ];
    client.SET(String(_id), JSON.stringify(puja), (err, reply) => {
      if (err) console.log(err.message);
    });
  });
};

const compare = (a, b) => {
  const firstElement = new Date(a.starting_time).getTime();
  const secondElement = new Date(b.starting_time).getTime();

  if (firstElement > secondElement) {
    return -1;
  }
  if (firstElement < secondElement) {
    return 1;
  }
  return 0;
};

const sendNewBidEmail = async (jsonBid) => {
  // Obtenci??n de datos para env??o de nueva y subasta y programar env??o de recordatorio
  const company = await User.findById(jsonBid.seller).select("company");
  let users = await User.find({ emailVerified: false })
    .select("email -_id")
    .lean();
  users = users.map((user) => user.email);
  const tempTime = new Date(jsonBid.starting_time).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
  });

  //console.log("jsonBid", jsonBid);
  const body_html = getHtmltoSend("../Templates/bid/newBid_template.hbs", {
    bid: jsonBid,
    id: String(jsonBid._id).slice(jsonBid._id.length - 4, jsonBid._id.length),
    company: company.company,
    start: tempTime,
    title: jsonBid.title,
  });
  const subject = "Nueva Cartera programada para subasta";
  const toAddresses =
    process.env.NODE_ENV === "production"
      ? "info@loan-transfer.com"
      : "rivas_jose_antonio@hotmail.com";
  const bccAddresses = process.env.NODE_ENV === "production" ? users : null;
  const emailSentInfo = await aws_email.sendEmail({
    toAddresses,
    subject,
    body_html,
    bccAddresses,
  });

  if (emailSentInfo.accepted.length > 0) {
    console.log("Email creaci??n de cartera enviado");
    Bid.findByIdAndUpdate(
      jsonBid._id,
      {
        $set: { "notifications.created": true },
      },
      { new: true },
      (err, bid) => {
        if (err) res.status(500).json(err);
      }
    );
    // TODO LOG de a quien se ha enviado
  }

  // Se programa el env??o de email recordatorio
  scheduleRememberEmail({ jsonBid, company, tempTime });
};

const scheduleRememberEmail = ({ jsonBid, company, tempTime }) => {
  const dateSchedule = new Date(jsonBid.starting_time);

  if (dateSchedule.getTime() - new Date().getTime() < 2 * 60 * 60 * 1000)
    return;
  console.log("Recordatorio de email programado");

  const email_message = getHtmltoSend(
    "../Templates/bid/startBid_template.hbs",
    {
      bid: jsonBid,
      id: String(jsonBid._id).slice(jsonBid._id.length - 4, jsonBid._id.length),
      company: company.company,
      start: tempTime,
      title: jsonBid.title,
    }
  );
  const email_subject = "Una subasta comienza pr??ximamente";

  aws_email.scheduleEmail({
    subject: email_subject,
    body_html: email_message,
    date: new Date(dateSchedule.getTime() - 30 * 60 * 1000),
    bid_id: jsonBid._id,
  });
};

const getSubbidDetails = async (bid_id, subbid_id, user_id) => {
  try {
    const bid = await Bid.findById(bid_id).lean();
    let subbid = bid.bids.find((sub) => String(sub._id) === String(subbid_id));
    const { admin } = await User.findById(user_id).select("admin -_id").lean();

    // Pasar docs y globalicons del padre

    subbid.documents = subbid.documents.concat(bid.documents);
    subbid.starting_time = bid.starting_time;
    subbid.end_time = bid.end_time;
    subbid.viewers = bid.viewers;
    subbid.seller = bid.seller;
    subbid.icons = subbid.icons.concat(bid.globalIcons);

    if (admin) {
      let pujas = await Promise.all(
        subbid.data.map(async (puja) => {
          if (puja.from === null) return;
          return User.findById(mongoose.Types.ObjectId(puja.from))
            .select("displayName company -_id")
            .lean();
        })
      );
      pujas = pujas.filter((puja) => puja !== undefined);
      subbid.data = subbid.data.filter((puja) => puja.from !== null);

      subbid.data = subbid.data.map((subbid, index) => {
        subbid = { ...subbid, ...pujas[index] };
        return subbid;
      });

      // Se env??a nombre y compa????a de cada persona que entr?? mientras estaba la subasta en marcha
      subbid.viewers &&
        (subbid.viewers = await Promise.all(
          subbid.viewers.map((viewer) => {
            return User.findById(mongoose.Types.ObjectId(viewer))
              .select("displayName company -_id")
              .lean();
          })
        ));
    } else {
      delete subbid["data"];
      delete subbid.viewers;
    }

    return subbid;
  } catch (error) {
    console.log(error);
  }
};

const removeEmptyObjects = (bidCreationObject) => {
  // Si alguno de los ids contenidos en bidCreationObject.subbids contiene un objeto vacio
  // se borra ese objeto y se saca su id del array
  bidCreationObject.subbids?.forEach((subbid_id) => {
    if (Object.keys(bidCreationObject[subbid_id])?.length === 0) {
      delete bidCreationObject[subbid_id];
      bidCreationObject.subbids = bidCreationObject.subbids.filter(
        (id) => id !== subbid_id
      );
    }
  });
};

const populateBidDocuments = async ({ user, bids, _id }) => {
  // Obtenemos los documentos subidos de redis
  const bidCreationObject = JSON.parse(
    await getAsyncRedis(`bidCreationObject-${user}`).catch((err) =>
      console.error(err)
    )
  );

  const tempBids = bids.map((bid) => {
    if (bidCreationObject.subbids?.includes(bid._id)) {
      !Array.isArray(bid.documents) && (bid.documents = []);
      bid.documents = bid.documents.concat(bidCreationObject[bid._id].documents);
    }
    return bid;
  });

  const tempDocuments =
    String(bidCreationObject.id) === String(_id) && bidCreationObject.documents
      ? bidCreationObject.documents
      : [];

  return { populatedBids: tempBids, documents: tempDocuments };
};
/* 
TODO
- A??adir atributo de estado creacion para no enviarlo en la lista de subastas ni historial
- Cron para eliminar las creaciones a medias
- Crear la subasta completamente con todos sus atributos
*/
