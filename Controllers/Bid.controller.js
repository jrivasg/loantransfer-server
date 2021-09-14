const createError = require("http-errors");
const Bid = require("../Models/bid.model");

module.exports = {
  getAll: async (req, res, next) => {
    try {
      //console.log(req.payload);
      const bid = await Bid.find().lean();
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
      res.status(200).json(bid);
    } catch (error) {
      next(error);
    }
  },
  getActiveBids: async (req, res, next) => {
    const today = new Date();
    const endday = new Date();
    try {
      //console.log(req.payload);
      const bid = await Bid.find({ 'bids.active': true }).lean();
      res.status(200).json(bid);
    } catch (error) {
      next(error);
    }
  },
  getOne: async (req, res, next) => {
    const { bid_id, subbid_id } = req.body;
    try {
      const bid = await Bid.findById(bid_id).lean();
      const subbid = bid.bids.find(
        (sub) => String(sub._id) === String(subbid_id)
      );

      //console.log(subbid);

      res.status(200).json(subbid);
    } catch (error) {
      next(error);
    }
  },
  createBid: async (req, res, next) => {
    const { title, minimunAmount, totalDebt, principalMount, icons, bids, seller, documentation } =
      req.body;
    console.log(req.body);

    new Bid({
      title,
      info: [
        {
          title: "Precio inicial",
          value: minimunAmount,
        },
        {
          title: "Deuda total",
          value: totalDebt,
        },
        {
          title: "Deuda principal",
          value: principalMount,
        },
      ],
      seller,
      icons,
      bids,
      documentation
    }).save((err, bid) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }
      res.status(200).json("Subasta creada");
    });

    try {
      // TODO Comprobar si el usuario ya tiene un chat con el otro usuario seleccionado
      /* const user = await User.findById(req.payload.aud).populate('chat').lean();
      const invitedUser = await User.findById(req.body.user_id).lean();
      if (user && invitedUser)
        new Chat({
          users: [
            {
              user_id: user._id,
              displayName: user.displayName,
            },
            {
              user_id: invitedUser._id,
              displayName: invitedUser.displayName,
            }, 
          ],
          messages: [],
        }).save((err, chat) => {
          if (err) return res.status(500).json(err);
          // Modificamos os usuarios para añadir el id del chat a sus arrays de chats
          User.findByIdAndUpdate(
            invitedUser._id,
            { $push: { chat: chat._id } },
            (err, doc) => {
              if (err) return res.json(500).json(err);

              User.findByIdAndUpdate(
                user._id,
                { $push: { chat: chat._id } },
                { new: true },
                (err, originalUser) => {
                  if (err) return res.json(500).json(err);
                  // Añadimos el chat al usuario previamente encontrado y se devuelve el array
                  user.chat.push(chat);
                  res.status(200).json(user.chat);
                }
              );
            }
          );          
        }); */
    } catch (error) {
      next(error);
    }
  },
  /* saveMessage: async (req, res, next) => {
    const { user_id, chat, message } = req.body;
    try {
      //console.log(req.payload);
      const user = await User.findById(req.body.user_id);
      const chat = user.chat.find();
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }, */
};
