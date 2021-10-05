module.exports = {
  newBidEmailTemplate: (bid) => {
    const info = `<td class="free-text">
                      La cartera #${String(bid._id).substring(
                        String(bid._id).length - 4
                      )} de {"nombre empresa"}
                      saldrá a subasta.
                    </td>`;
    const tempSubbids = bid.bids.map(({ reference, mainDebt }) => {
      return `<tr class="info-lote">
          ${reference}: <span style="text-align: end;">${mainDebt} €</span>
          <hr />
        </tr>`;
    });
    return `<body bgcolor="#f7f7f7">
        <table
          align="center"
          cellpadding="0"
          cellspacing="0"
          class="container-for-gmail-android"
          width="100%"
        >
          <tr>
            <td
              align="left"
              valign="top"
              width="100%"
              style="
            background: repeat-x
              url(http://s3.amazonaws.com/swu-filepicker/4E687TRe69Ld95IDWyEg_bg_top_02.jpg)
              #ffffff;
          "
            >
              <center>
                <img
                  src="http://s3.amazonaws.com/swu-filepicker/SBb2fQPrQ5ezxmqUTgCr_transparent.png"
                  class="force-width-gmail"
                />
                <table
                  cellspacing="0"
                  cellpadding="0"
                  width="100%"
                  bgcolor="#ffffff"
                  background="http://s3.amazonaws.com/swu-filepicker/4E687TRe69Ld95IDWyEg_bg_top_02.jpg"
                  style="background-color: transparent"
                >
                  <tr>

          </tr>
          </br></br>
          <tr>
            <td
              align="center"
              valign="top"
              width="100%"
              style="background-color: #f7f7f7"
              class="content-padding"
            >
              <center>
                <table cellspacing="0" cellpadding="0" width="600" class="w320">
                  <tr>
                    <td class="header-lg">¡Nueva subasta programada!</td>
                  </tr>
                  <tr>
                    ${info}
                  </tr>
                  <tr>
                    <td class="mini-block-container">
                      <table
                        cellspacing="0"
                        cellpadding="0"
                        width="100%"
                        style="border-collapse: separate !important"
                      >
                        <tr>
                          <td class="mini-block">
                            <table cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td>
                                  <table
                                    cellspacing="0"
                                    cellpadding="0"
                                    width="100%"
                                  >
                                    <tr>
                                      <td style="text-align: left !important;">
                                        Lotes a subasta:
                                      </td>
                                      <hr />
                                    </tr>
                                    ${tempSubbids}
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td class="button">
                                  <div>
                                    <v:roundrect
                                      xmlns:v="urn:schemas-microsoft-com:vml"
                                      xmlns:w="urn:schemas-microsoft-com:office:word"
                                      href="http://"
                                      style="
                                      height: 45px;
                                      v-text-anchor: middle;
                                      width: 155px;
                                    "
                                      arcsize="15%"
                                      strokecolor="#ffffff"
                                      fillcolor="#ff6f6f"
                                    >
                                      <w:anchorlock />
                                      <center
                                        style="
                                        color: #ffffff;
                                        font-family: Helvetica, Arial,
                                          sans-serif;
                                        font-size: 14px;
                                        font-weight: regular;
                                      "
                                      >
                                        Sign Up
                                      </center>
                                    </v:roundrect>
                                    <a
                                      href="http://"
                                      style="
                                    background-color: #ff6f6f;
                                    border-radius: 5px;
                                    color: #ffffff;
                                    display: inline-block;
                                    font-family: 'Cabin', Helvetica, Arial,
                                      sans-serif;
                                    font-size: 14px;
                                    font-weight: regular;
                                    line-height: 45px;
                                    text-align: center;
                                    text-decoration: none;
                                    width: 155px;
                                    -webkit-text-size-adjust: none;
                                    mso-hide: all;
                                  "
                                    >
                                      Sign Up
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </center>
            </td>
          </tr>

          <td
            align="center"
            valign="top"
            width="100%"
            style="background-color: #f7f7f7; height: 100px"
          >
            <center>
              <table cellspacing="0" cellpadding="0" width="600" class="w320">
                <tr>
                  <td style="padding: 25px 0 25px">
                    <strong>NPL Brokers S.L.</strong>
                    <br />
                    1234 Awesome St <br />
                    Madrid <br />
                    <br />
                  </td>
                </tr>
              </table>
            </center>
          </td>
        </table>
      </body>`;
  },
};
