export function extractJson(str: string) {
  console.info("STR is ", str);

  //   METHOD 1
  try {
    // Finds the text between the first "{" and the last "}"
    // this works for most cases
    const firstBraceIndex = str.indexOf("{");
    const lastBraceIndex = str.lastIndexOf("}");
    if (
      firstBraceIndex === -1 ||
      lastBraceIndex === -1 ||
      firstBraceIndex >= lastBraceIndex
    ) {
      console.log(
        "Invalid string format: no matching braces found or incorrect order"
      );
      throw new Error(
        "Invalid string format: no matching braces found or incorrect order"
      );
    }
    const substr = str.substring(firstBraceIndex + 1, lastBraceIndex);
    if (substr) {
      const finalSubstr = "{" + substr + "}";
      console.info("SUBSTRING is ", finalSubstr);
      return JSON.parse(cleanJsonString(finalSubstr));
    }
  } catch (err) {
    console.error("Error while doing the substring method", err);
  }

  //   METHOD 2
  try {
    // parsing by finding a json regex.
    // this fails when there is code in between which has {}
    const regex = /{.*?}/gs;
    const match = str.match(regex);
    if (match) {
      console.info("Match : ", `${match[0]}`);
      return JSON.parse(`${match[0]}`);
    }
  } catch (e) {
    console.error("Error regexing and parsing JSON: ", e);
  }

  //   METHOD 3
  try {
    // normal parsing considering that the whole string is a json string. for example
    // "{'something':false}"
    console.info("normal parsing  : ", `${str}`);
    return JSON.parse(`${str}`);
  } catch (e) {
    console.error("Error while normal parsing : `${str}` ", e);
  }

  throw new Error("Not a Valid JSON" + str);
}

function cleanJsonString(jsonString: string) {
  // Replacing newlines, tabs, and other control characters with their escaped versions
  return jsonString
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\f/g, "\\f");
}
