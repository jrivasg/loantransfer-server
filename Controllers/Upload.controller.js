const Bid = require("../Models/bid.model");
const Chat = require("../Models/chat.model");
const fileSystem = require("fs");
const path = require("path");

module.exports = {
  savefiles: async (req, res) => {
    const { bid_id, chat_id, subbid_id } = req.body;
    console.log(req.body);

    if (bid_id && !subbid_id)
      req.files.forEach(async (file) => {
        const bidExists = await Bid.findById(bid_id).lean();
        if (bidExists) {
          Bid.findByIdAndUpdate(
            bid_id,
            {
              $push: { documents: file },
            },
            { new: true },
            (err, bid) => {
              if (err) res.status(500).json(err);
              const doc = bid.documents[bid.documents.length - 1];
              res.status(200).json({ message: "Archivo/s guardado/s", bid });
            }
          );
        } else {
          new Bid({
            _id: bid_id,
            documents: [file],
          }).save((err, bid) => {
            if (err) {
              console.log(err);
              return res.status(500).json(err);
            }
            res.status(200).json({ message: "Archivo/s guardado/s", bid });
          });
        }
      });
    if (chat_id)
      req.files.forEach((file) => {
        Chat.findByIdAndUpdate(
          chat_id,
          { $push: { documents: file } },
          { new: true },
          (err, chat) => {
            if (err) res.status(500).json(err);
            //console.log(chat)
            const doc = chat.documents[chat.documents.length - 1];
            res.status(200).json({
              message: "Archivo/s guardado/s",
              doc_id: doc._id,
              mymetype: doc.mimetype,
              name: doc.originalname,
            });
          }
        );
      });
    if (bid_id && subbid_id) {
      req.files.forEach(async (file) => {
        const bid = await Bid.findById(bid_id).lean();
        let subbid;
        bid &&
          (subbid = bid.bids.find(
            (sub) => String(sub._id) === String(subbid_id)
          ));
        if (bid && subbid) {
          Bid.findOneAndUpdate(
            {
              _id: bid_id,
            },
            {
              $push: {
                "bids.$[el].documents": file,
              },
            },
            {
              arrayFilters: [{ "el._id": subbid_id }],
              new: true,
            },
            async (err, bid) => {
              if (err) {
                console.log(err);
                return res.status(500).json(err);
              }
              res.status(200).json({ message: "Archivo/s guardado/s", bid });
            }
          );
        } else if (bid && !subbid) {
          Bid.findOneAndUpdate(
            {
              _id: bid_id,
            },
            {
              bids: [
                {
                  _id: subbid_id,
                  documents: [file],
                },
              ],
            },
            { new: true },
            async (err, bid) => {
              if (err) {
                console.log(err);
                return res.status(500).json(err);
              }
              res.status(200).json({ message: "Archivo/s guardado/s", bid });
            }
          );
        } else if (!bid && !subbid) {
          new Bid(
            {
              _id: bid_id,
              bids: [
                {
                  _id: subbid_id,
                  documents: [file],
                },
              ],
            },
            { new: true }
          ).save((err, bid) => {
            if (err) {
              console.log(err);
              return res.status(500).json(err);
            }
            res.status(200).json({ message: "Archivo/s guardado/s", bid });
          });
        }
      });
    }
  },
  getAllBidFiles: async (req, res) => {
    const { bid_id } = req.body;
    const bid = await Bid.findById(bid_id)
      .lean()
      .catch((err) => {
        return res.status(500).json(err);
      });
    //console.log(req.body);
    bid && res.status(200).json(bid.documents);
  },
  getFile: async (req, res) => {
    const { doc_id, bid_id, chat_id } = req.query;
    //console.log(req.query);
    let doc;
    if (bid_id) {
      const bid = await Bid.findById(bid_id)
        .lean()
        .catch((err) => {
          return res.status(500).json(err);
        });
      doc = bid.documents.find((doc) => String(doc._id) === String(doc_id));
    }
    if (chat_id) {
      const chat = await Chat.findById(chat_id)
        .lean()
        .catch((err) => {
          console.log(err);
          return res.status(500).json(err);
        });
      doc = chat.documents.find((doc) => String(doc._id) === String(doc_id));
    }

    var filePath = path.join(doc.path);
    var stat = fileSystem.statSync(filePath);

    res.writeHead(200, {
      "Content-Type": doc.mimetype,
      "Content-Length": stat.size,
    });

    var readStream = fileSystem.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(res);
  },
  deleteFile: async (req, res) => {
    const { bid_id, doc_id, doc_path } = req.query;

    fileSystem.unlink(doc_path, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }
      Bid.findByIdAndUpdate(
        bid_id,
        { $pull: { document: { _id: doc_id } } },
        { new: true },
        (err, bid) => {
          if (err) return res.status(500).json(err);
          res.status(200).json(bid.document);
        }
      );
    });
  },
};
