const NEXT_JS_ERROR_MESSAGES = ["NEXT_REDIRECT", "NEXT_NOT_FOUND"];

export const isFrameworkError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  if (NEXT_JS_ERROR_MESSAGES.includes(error.message)) {
    return true;
  }

  return false;
};
