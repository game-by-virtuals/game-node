import { GameAgent } from "@virtuals-protocol/game";

import axios from "axios";
import { GameTwitterClient } from "../dist";

// GAME-API
// "apt-ed78258ea434740bba9d7523b03bea42"

const gameTwitterClient = new GameTwitterClient({
  accessToken: "apx-45e0b570461aca1018681d60d5751d87",
});

(async () => {
  try {
    // const a = await gameTwitterClient.me();

    // // console.log(a);

    // const client = new TwitterApi(
    //   "Z0dZbUR4Qm14ZWctTFpOTHk5ZTczSmtoMzFYc2VPOXJ1VnlSdUtSLVRmbVpkOjE3NDAyNDU4OTM3OTA6MToxOmF0OjE"
    // );

    // const url =
    //   "https://s21-kling.klingai.com/bs2/upload-ylab-stunt-sgp/se/ai_portal_sgp_m2v_img2video_multi_id_v16/d3a57df2-4285-40de-830d-08e6f385c3c8_video.mp4?x-kcdn-pid=112372";

    const url =
      "https://media.posterlounge.com/img/products/660000/653583/653583_poster.jpg";

    // console.log(response.data);

    const response = await fetch(
      "https://s21-kling.klingai.com/bs2/upload-ylab-stunt-sgp/se/ai_portal_sgp_m2v_img2video_multi_id_v16/d3a57df2-4285-40de-830d-08e6f385c3c8_video.mp4?x-kcdn-pid=112372"
    );
    const blob = await response.blob();

    const mediaId = await gameTwitterClient.uploadMedia(blob);

    console.log(mediaId);

    await gameTwitterClient.post("post and media", [mediaId]);

    // console.log(mediaId);

    // const mentions = await gameTwitterClient.like("1899375598616895754");

    // console.log(mentions);

    // const response = await fetch(
    //   "https://images.freeimages.com/image/previews/553/rainbow-sun-quote-png-5690551.png"
    // );
    // const blob = await response.blob();

    // console.log(blob);

    // const mediaId = await gameTwitterClient.uploadMedia(blob);

    // console.log(mediaId);

    // await gameTwitterClient.post("post and media", [mediaId]);

    // const b = await client.v2.like

    // console.log(b);

    // const resp = await client.v2.like(user.data.id, "1887707248849510675");

    // console.log(resp);

    // const adminClient = new TwitterApi({
    //   appKey: "6Jh52vfckciX2ZTrtpqsS6W2a",
    //   appSecret: "NSXLkeN8kPQf9QO4rcbVk7BervYFjmr2W2m7ZwRNyPGbAcY6KG",
    //   accessToken: "1859490326316187649-Ke8OIomDawz7KCGnFsOrkUGzcuzHQt",
    //   accessSecret: "mbOhkqleNRoOBF4f6Ehp5zUw0mTIc5895PnxHrIX7I2e5",
    // });

    // const adminUser = await adminClient.v2.lik;
    // console.log(adminUser);

    // const a = await adminClient.v2.like(user.data.id, "1887707248849510675");
    // console.log(a);

    // // const resp = await client.v2.like()
    // console.log(user, adminUser);

    // const resp = await adminClient.v2.like(user.data.id, "1887707248849510675");

    // console.log(resp);
  } catch (error) {
    console.log(error);
  }
})();
