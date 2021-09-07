const Bid = require("../Models/bid.model");
const fileSystem = require("fs");
const path = require("path");

module.exports = {
  savefiles: async (req, res) => {
    const { bid_id } = req.body;
    req.files.forEach((file) => {
      file.uploadBy = req.payload.aud;
      Bid.findByIdAndUpdate(bid_id, { $push: { documentation: file } }, (err, doc) => {
        if (err) res.status(500).json(err);
      });
    });
    res.status(200).json("Archivo/s guardado/s");
  },
  getAllBidFiles: async (req, res) => {
    const { bid_id } = req.body;
    const bid = await Bid.findById(bid_id)
      .lean()
      .catch((err) => {
        return res.status(500).json(err);
      });
    //console.log(req.body);
    bid && res.status(200).json(bid.documentation);
  },
  getFile: async (req, res) => {
    const { doc_id, bid_id } = req.query;
    const bid = await Project.findById(bid_id).lean();
    const doc = bid.documentation.find((doc) => String(doc._id) === String(doc_id));
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
                console.error(err)
                return res.status(500).json(err);
            }
            Bid.findByIdAndUpdate(
              bid_id,
              { $pull: { documentation: { _id: doc_id } } },
              { new: true },
              (err, bid) => {
                if (err) return res.status(500).json(err);
                res.status(200).json(bid.documentation);
              }
            );
        });
    },
};
