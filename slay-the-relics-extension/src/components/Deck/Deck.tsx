import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { KeywordTips, PowerTipBlock, TipBody } from "../Tip/Tip";
import { ReturnButton } from "../Buttons/Buttons";
import { Cards, LocalizationContext } from "../Localization/Localization";
import ReactDOMServer from "react-dom/server";
import { PlacesType } from "react-tooltip";

type DeckType = "deck" | "draw" | "discard" | "exhaust";
type Bottle = "flame" | "lightning" | "tornado" | null;

function BottleURL(bottle: Bottle): string | null {
  if (bottle === null) {
    return null;
  }
  return `./img/relics/bottled_${bottle}.png`;
}

export type CardData = string | [string, number];

function cardName(card: CardData): string {
  if (typeof card === "string") {
    return card;
  }
  return card[0];
}

function cardValue(card: CardData): number {
  if (typeof card === "string") {
    return 0;
  }
  return card[1];
}

function withCardName(card: CardData, fn: (n: string) => string): CardData {
  const newName: string = fn(cardName(card));
  if (typeof card === "string") {
    return newName;
  }
  return [newName, card[1]];
}

function formatForSlaytabase(val: string): string {
  return val
    .split("+")[0]
    .replaceAll(":", "-")
    .replaceAll("'", "")
    .replaceAll(" ", "")
    .toLowerCase();
}

function slaytabaseUrlForCard(card: string, upgraded: boolean): string {
  let formattedCard = encodeURI(formatForSlaytabase(card));
  if (upgraded) {
    formattedCard += "plus1";
  }

  return `https://raw.githubusercontent.com/Spireblight/slay-the-relics/refs/heads/master/assets/sts1/card-images/${formattedCard}.png`;
}

function lookupCard(name: string, cardsLoc: Cards): string {
  const normalName = name.replaceAll("+", "");
  const upgraded = name.includes("+");

  const cardLoc = cardsLoc[normalName];
  if (!cardLoc) {
    return "";
  }

  if (upgraded && cardLoc.UPGRADE_DESCRIPTION) {
    return cardLoc.UPGRADE_DESCRIPTION;
  }
  return cardLoc.DESCRIPTION;
}

export function Card(props: {
  data: CardData;
  bottle: Bottle;
  character: string;
  onClick: () => void;
  additionalClasses: string;
}) {
  const name = cardName(props.data);
  const upgraded = name.includes("+");
  const slaytabaseName = formatForSlaytabase(name);
  const bottleURL = BottleURL(props.bottle);

  const loc = useContext(LocalizationContext);

  const cardStyle: CSSProperties = {
    backgroundImage: `url(${slaytabaseUrlForCard(name, upgraded)})`,
  };

  const description = lookupCard(name, loc.cards);
  const tips = KeywordTips(description, loc.keywords);

  let addDescription = "";
  let addTitle = "";
  switch (slaytabaseName) {
    case "geneticalgorithm":
      if (upgraded) {
        addDescription = description.replaceAll("!M!", "#g3");
      } else {
        addDescription = description.replaceAll("!M!", "2");
      }
      addDescription = addDescription.replaceAll(
        "!B!",
        cardValue(props.data).toString(10),
      );
      break;
    case "ritualdagger":
      if (upgraded) {
        addDescription = description.replaceAll("!M!", "#g5");
      } else {
        addDescription = description.replaceAll("!M!", "3");
      }
      addDescription = addDescription.replaceAll(
        "!D!",
        cardValue(props.data).toString(10),
      );
      break;
    case "searingblow": {
      const timesUpgraded = cardValue(props.data);
      let damage = 12;
      for (let i = 0; i < timesUpgraded; i++) {
        damage += 4 + i;
      }
      addDescription = description.replaceAll("!D!", damage.toString(10));
      addTitle = "Searing Blow";
      if (timesUpgraded > 0) {
        addTitle = `#gSearing #gBlow+${timesUpgraded}`;
      }
      break;
    }
  }
  addDescription = addDescription
    .replaceAll("Block", "#yBlock")
    .replaceAll("Exhaust", "#yExhaust")
    .replaceAll("Fatal", "#yFatal")
    .replaceAll("Upgraded", "#yUpgraded");

  const tooltipPlace: PlacesType = "right";

  const powerTipBlock = (
    <PowerTipBlock
      magGlass={false}
      tips={tips}
      character={props.character}
      noExpand={true}
      place={tooltipPlace}
    />
  );

  return (
    <div
      style={cardStyle}
      className={
        props.additionalClasses + " flex flex-col items-center relative"
      }
      onClick={props.onClick}
      data-tooltip-id={"root-tooltip"}
      data-tooltip-html={ReactDOMServer.renderToStaticMarkup(powerTipBlock)}
      data-tooltip-place={tooltipPlace}
    >
      {bottleURL && (
        <img
          src={bottleURL}
          style={{
            position: "absolute",
            right: "-3.3%",
            top: "-1%",
            width: "30%",
            zIndex: 40,
          }}
          alt={`bottled ${props.bottle}`}
        />
      )}
      {addTitle && (
        <div
          className={"w-[59%] h-[7%] absolute"}
          style={{
            top: "10%",
            textAlign: "center",
            backgroundColor: "#7cdde3",
          }}
        >
          <TipBody
            className={"card-title"}
            character={props.character}
            raw={addTitle}
          />
        </div>
      )}
      {addDescription && (
        <div
          className={"w-[66%] h-[34%] absolute"}
          style={{
            backgroundColor: "#404040",
            top: "59.5%",
            textAlign: "center",
          }}
        >
          <TipBody
            className={"card-text"}
            character={props.character}
            raw={addDescription}
          />
        </div>
      )}
    </div>
  );
}

export function CardView(props: {
  cards: CardData[];
  selectedIndex: number;
  bottles?: number[];
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  display: string;
  setDisplay: Dispatch<SetStateAction<string>>;
  upgradeChecked: Map<number, boolean>;
  setUpgradeChecked: Dispatch<SetStateAction<Map<number, boolean>>>;
  character: string;
}) {
  if (props.cards.length < 1) {
    return <div></div>;
  }

  const card = props.cards[props.selectedIndex];
  const isUpgrade = (i: number) => {
    return (
      props.upgradeChecked.get(i) ?? cardName(props.cards[i]).includes("+")
    );
  };
  const toggleUpgrade = (i: number) => {
    props.setUpgradeChecked((prev) => {
      const newMap = new Map(prev);
      newMap.set(i, !isUpgrade(i));
      return newMap;
    });
  };
  const resetUpgrade = (i: number) => {
    props.setUpgradeChecked((prev) => {
      const newMap = new Map(prev);
      newMap.delete(i);
      return newMap;
    });
  };

  const nextCard = () => {
    props.setSelectedIndex((i) => i + 1);
  };
  const prevCard = () => {
    props.setSelectedIndex((i) => i - 1);
  };

  const closeCard = () => {
    props.setDisplay("hidden");
    resetUpgrade(props.selectedIndex);
  };

  const prevBtnEnabled = props.selectedIndex > 0;
  const nextBtnEnabled = props.selectedIndex < props.cards.length - 1;

  let bottle: Bottle = null;
  if (props.bottles) {
    if (props.bottles[0] === props.selectedIndex) {
      bottle = "flame";
    } else if (props.bottles[1] === props.selectedIndex) {
      bottle = "lightning";
    } else if (props.bottles[2] === props.selectedIndex) {
      bottle = "tornado";
    }
  }

  return (
    <div
      className={
        props.display +
        " absolute w-full h-full justify-center items-center card-view"
      }
      onClick={closeCard}
    >
      <button
        onClick={(event) => {
          if (!prevBtnEnabled) {
            return;
          }
          event.stopPropagation();
          prevCard();
        }}
        id={"card_view_prev_btn"}
        className={prevBtnEnabled ? "prev_btn_enabled" : ""}
      />
      <div
        className={"flex flex-col w-[40%] h-full items-center justify-center"}
      >
        <Card
          data={withCardName(card, (name) => {
            return isUpgrade(props.selectedIndex)
              ? name + "+"
              : name.replaceAll("+", "");
          })}
          bottle={bottle}
          character={props.character}
          additionalClasses={"card-view-card"}
          onClick={closeCard}
        />
        <button
          id={"card_view_checkbox"}
          className={
            isUpgrade(props.selectedIndex)
              ? "card-view-checkbox-checked"
              : "card-view-checkbox-unchecked"
          }
          onClick={(event) => {
            event.stopPropagation();
            toggleUpgrade(props.selectedIndex);
          }}
        />
      </div>
      <button
        onClick={(event) => {
          if (!nextBtnEnabled) {
            return;
          }
          event.stopPropagation();
          nextCard();
        }}
        id={"card_view_next_btn"}
        className={nextBtnEnabled ? "next_btn_enabled" : ""}
      />
    </div>
  );
}

export function CardGrid(props: {
  cards: CardData[];
  bottles?: number[];
  deckViewMode: string;
  setCardIndex: Dispatch<SetStateAction<number>>;
  setCardViewMode: Dispatch<SetStateAction<string>>;
  character: string;
}) {
  return (
    <div
      className={props.deckViewMode + " absolute justify-center w-screen"}
      style={{
        top: "6.018%",
        height: "93.982%",
        zIndex: 10,
        overflowY: "scroll",
        backgroundColor: "rgba(0,0,0,0.85)",
      }}
    >
      <div
        className={
          "grid grid-cols-5 grid-flow-row gap-2 w-2/3 content-around z-10"
        }
      >
        {props.cards.map((card, i) => {
          let bottle: Bottle = null;
          if (props.bottles) {
            if (props.bottles[0] === i) {
              bottle = "flame";
            } else if (props.bottles[1] === i) {
              bottle = "lightning";
            } else if (props.bottles[2] === i) {
              bottle = "tornado";
            }
          }
          return (
            <Card
              key={"card-" + i}
              data={card}
              bottle={bottle}
              additionalClasses={"deck-card"}
              character={props.character}
              onClick={() => {
                props.setCardIndex(i);
                props.setCardViewMode("flex");
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function DeckButton(props: {
  cardCount: number;
  deckViewMode: string;
  setDeckViewMode: Dispatch<SetStateAction<string>>;
  setCardViewMode: Dispatch<SetStateAction<string>>;
  resetCardView: () => void;
  what: DeckType;
}) {
  const locationStyle: CSSProperties = {
    display: props.cardCount ? "block" : "none",
  };
  switch (props.what) {
    case "deck":
      locationStyle.top = "0%";
      locationStyle.right = "4.322%";
      break;
    case "draw":
      locationStyle.top = "89%";
      locationStyle.left = "2.322%";
      break;
    case "discard":
      locationStyle.top = "89%";
      locationStyle.left = "94.322%";
      break;
    case "exhaust":
      locationStyle.top = "78.5%";
      locationStyle.left = "94.56%";
      break;
  }

  return (
    <button
      style={locationStyle}
      className={"button-border"}
      id={"deck_button"}
      onClick={() => {
        if (props.deckViewMode === "hidden") {
          props.setDeckViewMode("flex");
        } else {
          props.setDeckViewMode("hidden");
          props.setCardViewMode("hidden");
          props.resetCardView();
        }
      }}
    ></button>
  );
}

export function DeckView(props: {
  cards: CardData[];
  bottles?: number[];
  character: string;
  what: DeckType;
  enableCardView?: boolean;
}) {
  const [deckViewMode, setDeckViewMode] = useState("hidden");
  const [cardViewMode, setCardViewMode] = useState("hidden");
  const [cardIndex, setCardIndex] = useState(0);
  const [upgradeChecked, setUpgradeChecked] = useState<Map<number, boolean>>(
    new Map(),
  );

  const resetCardView = () => {
    setCardIndex(0);
    setUpgradeChecked(new Map());
  };
  const nextCard = () => {
    if (cardIndex === props.cards.length - 1) {
      return;
    }
    setCardIndex((i) => i + 1);
  };
  const prevCard = () => {
    if (cardIndex === 0) {
      return;
    }
    setCardIndex((i) => i - 1);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (cardViewMode === "flex") {
          setCardViewMode("hidden");
          resetCardView();
        } else {
          setDeckViewMode("hidden");
          resetCardView();
        }
      } else if (e.key === "ArrowRight" && cardViewMode === "flex") {
        nextCard();
      } else if (e.key === "ArrowLeft" && cardViewMode === "flex") {
        prevCard();
      }
    },
    [
      cardViewMode,
      setCardViewMode,
      resetCardView,
      setDeckViewMode,
      prevCard,
      nextCard,
    ],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  let closeText = "Close Deck";
  switch (props.what) {
    case "deck":
      closeText = "Close Deck";
      break;
    case "draw":
      closeText = "Close Draw Pile";
      break;
    case "discard":
      closeText = "Close Discard Pile";
      break;
    case "exhaust":
      closeText = "Close Exhaust Pile";
      break;
  }
  return (
    <div>
      {deckViewMode === "flex" && (
        <ReturnButton
          text={closeText}
          onClick={() => {
            setDeckViewMode("hidden");
            setCardViewMode("hidden");
            resetCardView();
          }}
        />
      )}
      <DeckButton
        what={props.what}
        cardCount={props.cards.length}
        deckViewMode={deckViewMode}
        setDeckViewMode={setDeckViewMode}
        setCardViewMode={setCardViewMode}
        resetCardView={resetCardView}
      />
      <CardGrid
        cards={props.cards}
        bottles={props.bottles}
        character={props.character}
        deckViewMode={deckViewMode}
        setCardIndex={setCardIndex}
        setCardViewMode={setCardViewMode}
      />
      {props.enableCardView && (
        <CardView
          bottles={props.bottles}
          character={props.character}
          cards={props.cards}
          selectedIndex={cardIndex}
          setSelectedIndex={setCardIndex}
          display={cardViewMode}
          setDisplay={setCardViewMode}
          upgradeChecked={upgradeChecked}
          setUpgradeChecked={setUpgradeChecked}
        />
      )}
    </div>
  );
}
