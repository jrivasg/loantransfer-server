//const Project = require("../models/Project.model");
const fileSystem = require('fs');
const path = require('path');

module.exports = {
    savefiles: async (req, res) => {
        const { user_id, project_id } = req.body;
        req.files.forEach(file => {
            file.uploadBy = user_id;
            /* Project.findByIdAndUpdate(project_id, { $push: { docs: file } },
                (err, doc) => {
                    if (err) res.status(500).json(err);
                }) */
        });
        res.status(200).json('Archivo/s guardado/s');
    },
    getAllBidFiles: async (req, res) => {
        //const { project_id } = req.body;
        //const project = await Project.findById(project_id).lean().catch(err => { return res.status(500).json(err) });
console.log(req.body)
         res.status(200).json([]);
    },
/*     getFile: async (req, res) => {
        const { doc_id, project_id } = req.query;
        const project = await Project.findById(project_id).lean();
        const doc = project.docs.find(doc => String(doc._id) === String(doc_id));

        var filePath = path.join(doc.path);
        var stat = fileSystem.statSync(filePath);

        res.writeHead(200, {
            'Content-Type': doc.mimetype,
            'Content-Length': doc.size
        });

        var readStream = fileSystem.createReadStream(filePath);
        // We replaced all the event handlers with a simple call to readStream.pipe()
        readStream.pipe(res);
    },
    deleteFile: async (req, res) => {
        const { project_id, doc_id, doc_path } = req.query;

        fileSystem.unlink(doc_path, async (err) => {
            if (err) {
                console.error(err)
                return res.status(500).json(err);
            }
            Project.findByIdAndUpdate(project_id, { $pull: { docs: { _id: doc_id } } },
                { new: true },
                (err, project) => {
                    if (err) return res.status(500).json(err);
                    res.status(200).json(project.docs);
                })
        });
    }, */
};
