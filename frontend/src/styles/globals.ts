export const colors = {
  primary: "#212B36",
  accent: "#fa531c",
};

export const globalButton = {
  margin: "auto 10px",
  padding: "10px 25px",
  borderRadius: "10px",
  fontWeight: "bold",
  height: "min-content",
};

export const accentButton = {
  ...globalButton,
  backgroundColor: colors.accent,
  "&:hover": {
    backgroundColor: colors.accent,
  },
};
