const normalizeText = (text) => {
  return text.replace(/\\n/g, '').trim();
};

export { normalizeText };
