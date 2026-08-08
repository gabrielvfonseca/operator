/**
 * Help examples shown by the Browser CLI root command.
 */
/** Core Browser CLI examples for lifecycle and inspection commands. */
export const browserCoreExamples = [
  "operator browser status",
  "operator browser start",
  "operator browser start --headless",
  "operator browser stop",
  "operator browser tabs",
  "operator browser open https://example.com",
  "operator browser focus abcd1234",
  "operator browser close abcd1234",
  "operator browser screenshot",
  "operator browser screenshot --full-page",
  "operator browser screenshot --ref 12",
  "operator browser snapshot",
  "operator browser snapshot --format aria --limit 200",
  "operator browser snapshot --efficient",
  "operator browser snapshot --labels",
];

/** Browser CLI examples for interaction/action commands. */
export const browserActionExamples = [
  "operator browser navigate https://example.com",
  "operator browser resize 1280 720",
  "operator browser click 12 --double",
  "operator browser click-coords 120 340",
  'operator browser type 23 "hello" --submit',
  "operator browser press Enter",
  "operator browser hover 44",
  "operator browser drag 10 11",
  "operator browser select 9 OptionA OptionB",
  "operator browser upload /tmp/operator/uploads/file.pdf",
  "operator browser upload media://inbound/file.pdf",
  'operator browser fill --fields \'[{"ref":"1","value":"Ada"}]\'',
  "operator browser dialog --accept",
  'operator browser wait --text "Done"',
  "operator browser evaluate --fn '(el) => el.textContent' --ref 7",
  "operator browser evaluate --fn 'const title = document.title; return title;'",
  "operator browser console --level error",
  "operator browser pdf",
];
