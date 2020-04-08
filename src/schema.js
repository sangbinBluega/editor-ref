const CHOICE_ENUM_LIST = [
  "select",
  "rich-text",
  "audio",
  "image",
  "video",
  "null"
];
const CONTENT_ENUM_LIST = [
  "word",
  "text",
  "rText",
  "image",
  "audio",
  "video",
  "null"
];
const DROPALIGN_ENUM_LIST = ["R", "L", "T", "B", "C", "N"];

const PROPERTIES_DATA = {
  Type: {
    enum: CONTENT_ENUM_LIST
  },
  dropAlign: {
    enum: DROPALIGN_ENUM_LIST
  }
};

const schema = {
  properties: {
    Body: {
      properties: PROPERTIES_DATA
    },
    choice: {
      properties: {
        Type: {
          enum: CHOICE_ENUM_LIST
        },
        Content: {
          properties: PROPERTIES_DATA
        },
        comment: {
          properties: {
            PROPERTIES_DATA
          }
        }
      }
    },
    correctResponse: {
      properties: {
        PROPERTIES_DATA
      }
    }
  }
};

export default schema;
