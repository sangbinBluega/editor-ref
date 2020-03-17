const sampleData = {
  Body: [
    {
      Content: [{ Type: "image", Data: "DEMO/D1B1_Good_morning.png" }],
      comment: { Type: "audio", Data: "DEMO/D1B0_Good_morining.mp3" }
    }
  ],
  choice: [
    {
      Type: "select",
      Content: [
        { Type: "audio", Data: "DEMO/D1B0_Good_morining.mp3", aux: true },
        { Type: "text", Data: "Good morning." }
      ],
      answer: "a",
      comment: { Type: "text", Data: "Good morning." }
    },
    {
      Type: "select",
      Content: [
        { Type: "audio", Data: "DEMO/D1B0_Good_afternoon.mp3", aux: true },
        { Type: "text", Data: "Good afternoon." }
      ],
      answer: "b",
      comment: { Type: "text", Data: "Good afternoon." }
    }
  ],
  correctResponse: [[{ answer: ["a"] }]],
  meta: {
    subject: ["000_003", "dict:good morning"],
    sentence: ["001009002", "001008003", "001008004"]
  }
};

export default sampleData;
