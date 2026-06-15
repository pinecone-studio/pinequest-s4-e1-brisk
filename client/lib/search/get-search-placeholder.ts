export const getSearchPlaceholder = (pathname: string) => {
  if (pathname.startsWith("/recordings/")) {
    return "Search transcript, speakers, and key points…";
  }

  if (pathname.startsWith("/recordings")) {
    return "Search recordings…";
  }

  if (pathname.startsWith("/meetings/")) {
    return "Search transcript, notes, and topics…";
  }

  if (pathname.startsWith("/meetings")) {
    return "Search meetings…";
  }

  if (pathname.startsWith("/home")) {
    return "Search meetings and calendar events…";
  }

  if (pathname.startsWith("/settings")) {
    return "Search settings…";
  }

  return "Search this page…";
};
