console.log(
  Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, "base64").toString(
    "utf8"
  )
);
