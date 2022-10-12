import axios from "axios";

export const subscribe_wallet = (wallet: string) =>
  axios.put(
    "https://monitor-api-nicbatbx3a-ue.a.run.app/subscription",
    {
      subscription_id: 203,
      query: {
        addlist: [wallet],
      },
    },
    {
      headers: {
        Authorization: "Bearer jk-F1BOoQdMOh1Mn_VOpUIi-xXzWe7NKgt48gWjKhZg",
        "Content-Type": "application/json",
      },
    }
  );
