import ollama from "ollama";
import { MultiLangSymbolsDict } from "../../client/index.d";

import multiLangSymbolsDict from "../../../public/data/bliss_dict_multi_langs.json" with { type: "json" };

function getCompositions(symbolDict) {
  const compositions = {};

  for (const blissId in symbolDict) {
    const composition = symbolDict[blissId].composition;

    if (composition) {
      const compString = composition.join("");
      compositions[compString] = blissId;
    }
  }

  return compositions;
};

const compositionDict = getCompositions(multiLangSymbolsDict);

const indicators = [
  "8993", // action
  "8994", // active
  "8995", // conditional
  "8996", // description after fact
  "8997", // description before fact
  "8998", // description
  "8999", // future action
  "9000", // future conditional
  "9001", // future passive
  "9002", // future passive conditional
  "9003", // passive
  "9004", // past action
  "9005", // past conditional
  "9006", // past passive conditional
  "9007", // past passive
  "9008", // present passive conditional
  "9009", // thing
  "9010", // thing plural
  "9011", // plural
  "24665", // adverb
  "24667", // definite form
  "24668", // female (OLD)
  "24669", // first person (OLD)
  "24670", // imperative form
  "24671", // indefinite form (OLD)
  "24672", // neutral (OLD)
  "24673", // object form (OLD)
  "24674", // past participle 1
  "24675", // past participle 2
  "24676", // possessive form (OLD)
  "24677", // present participle
  "24678", // second person (OLD)
  "24679", // third person (OLD)
  "24807", // present action
  "25458", // diminutive form (OLD)
  "28043", // continuous form
  "28044", // plural definite
  "28045", // thing definite
  "28046", // thing plural definite
];

const formatting = [";", "/", "//"];

function isFormatting(symbol) {
  return formatting.includes(symbol) || symbol.startsWith("RK:") || symbol.startsWith("AK:");
};

function compositionToId(composition) {
  const compStr = composition.join("");

  return compositionDict[compStr];
}

export function expandBliss(symbols, lang = "en") {
  if (symbols.length > 1) {
    const compId = compositionToId(symbols);

    if (compId) {
      // return multiLangSymbolsDict[compId];

      return { id: compId, ...multiLangSymbolsDict[compId] };
    }
  }

  const filtered = symbols.filter((symbol) => {
    const idStr = String(symbol);
    // return Array.isArray(symbol) || (symbol && !isFormatting(idStr) && !indicators.includes(idStr));
    return Array.isArray(symbol) || (symbol && !isFormatting(idStr));
  });

  return filtered.map(symbol => {
    if(Array.isArray(symbol)) {
      const compId = compositionToId(symbol);

      if (compId) {
        // return multiLangSymbolsDict[compId];

        return { id: compId, ...multiLangSymbolsDict[compId] };
      }

      // TODO process for trying to guess composition parts
      return {
        composition: expandBliss(symbol, lang)
      };

    } else {
      const expanded = multiLangSymbolsDict[symbol];

      if (!expanded) {
        throw new Error(`Bliss symbol not found: ${symbol} is not a valid Bliss symbol`);
      }

      // return expanded;
      return { id: symbol, expanded };
    }
  });
};

export async function translate(symbols, lang = "en") {
  const expanded = expandBliss(symbols, lang);

  // Test chat message
  //
  // const response = await ollama.chat({
  //   model: 'llama3.1',
  //   messages: [{ role: 'user', content: 'Why is the sky blue?' }],
  // });
  //
  // console.log(response.message.content);

  // Output list of models
  //
  // const list = await ollama.list();
  // console.log(list);

  const lms = [
    "gemma3n:latest",
    "deepseek-r1:latest",
    "llama3.1:latest",
  ];

  // Output models info
  //
  // lms.forEach(async lm => {
  //   const response = await ollama.show({
  //     "model": lm,
  //   });

  //   console.log(response);
  // });

  // Test translate message

  const translations = {};
  // lms.forEach(async lm => {
  //   const output = await ollama.chat({
  //     model: lm,
  //     messages: [{
  //       role: "user",
  //       content: `Create a single grammatically correct sentence constructed from the following words: ${expanded.join(", ")}.`,
  //     }]
  //   });

  //   console.log(output);

  //   translations[lm] = output.message.content;
  // });

  await Promise.all(lms.map(async (lm) => {
    const words = expanded.map(bliss => bliss.description.en);
    const output = await ollama.chat({
      model: lm,
      messages: [{
        role: "user",
        content: `Using a symbolic language, a user has entered symbols with following descriptions: ${words.join(", ")}. Construct a grammatically correct sentence or phrase from the user's input.`,
        // content: `Create a single grammatically correct sentence constructed from words described as follows: ${words.join(", ")}.`,
        // content: `Create a single grammatically correct sentence constructed from the following words: ${words.join(", ")}.`,
      }]
    });

    console.log(output);

    translations[lm] = output.message.content;
  }));

  return translations;
  // return expanded;

  /*

  Installed models:
  - gemma3n:latest
  - deepseek-r1:latest
  - llama3.1:latest

  */

  /*

    - construct prompt from expanded
    - send prompt to ollama
    - return response
    - options:
      - language
      - number or responses
      - which ai model(s) to use

  */
}

export function predictNextWord() {

}

export function getMultiLangSymbolDict() {
  return multiLangSymbolsDict;
};

export function getCompositionDict() {
  return compositionDict;
}

/*

Samples to try

- Vampire: 25209
  - [[23577, "/", 18209, "/", 15206]]
- brother birthday wednesday: 12909, 12846, 25215
  - [[17209, "/", 8498], [13639, "/", 12843], [13639, "/", 8500, "/", 8513]]
- tie whipping knot - (to): 25386
  - [25616, ";", 8993, "/", 15214, ";", 9009, "/", 23409]
- humidifier (made up by me)
  - [23886, ";", 8993]
*/
