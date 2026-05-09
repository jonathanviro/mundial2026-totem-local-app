import { useRef, useState, useMemo } from "react";

type Mode = "default" | "numeric" | "email" | "alphanumeric" | "no-at";

const L = {
  default: [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"],
    ["SHIFT", "z", "x", "c", "v", "b", "n", "m", "⌫"],
    ["123", "@", "SPACE", ".", "OK"],
  ],
  shift: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["shift", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
    ["123", "@", "SPACE", ".", "OK"],
  ],
  numeric: [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["⌫", "0", "OK"],
  ],
  alphanumeric: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "⌫"],
    ["@", ".com", "SPACE", "OK"],
  ],
  "no-at": [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["Z", "X", "C", "V", "B", "N", "M", "⌫"],
    ["SPACE", "OK"],
  ],
  email: [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"],
    ["SHIFT", "z", "x", "c", "v", "b", "n", "m", "⌫"],
    ["@", ".com", "@gmail", "@outlook", "@yahoo", "SPACE", "OK"],
  ],
  "email-shift": [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
    ["@", ".COM", "@GMAIL", "@OUTLOOK", "@YAHOO", "SPACE", "OK"],
  ],
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  mode?: Mode;
  onDone?: () => void;
}

export function VirtualKeyboard({
  value,
  onChange,
  mode = "default",
  onDone,
}: Props) {
  const [shifted, setShifted] = useState(false);

  const layout = useMemo(() => {
    if (mode === "numeric") return L.numeric;
    if (mode === "alphanumeric") return L.alphanumeric;
    if (mode === "email") return shifted ? L["email-shift"] : L.email;
    if (mode === "no-at") return L["no-at"]; // Always uppercase, ignore shift
    return shifted ? L.shift : L.default;
  }, [mode, shifted]);

  const handleKey = (key: string) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "OK") {
      onDone?.();
      return;
    }
    if (key === "SPACE") {
      onChange(value + " ");
      return;
    }
    if (key === "SHIFT" || key === "shift") {
      setShifted((s) => !s);
      return;
    }
    if (key === "123" || key === "ABC") {
      return;
    }
    // Handle @ and domains for email
    if (key === "@") {
      // Remove any existing @domain to avoid duplicates
      const newVal = value.includes("@") ? value.replace(/@.*/, "") : value;
      onChange(newVal + key);
      return;
    }
    // Handle domains with @ (e.g., @gmail, @outlook, @yahoo)
    if (
      ["@gmail", "@outlook", "@yahoo", "@GMAIL", "@OUTLOOK", "@YAHOO"].includes(
        key,
      )
    ) {
      // Remove any existing @domain
      const newVal = value.includes("@") ? value.replace(/@.*/, "") : value;
      onChange(newVal + key);
      return;
    }
    // Handle .com domains
    if ([".com", ".COM"].includes(key)) {
      // Remove any existing domain
      let newVal = value;
      [".com", ".COM"].forEach((d) => {
        if (newVal.includes(d)) newVal = newVal.replace(d, "");
      });
      onChange(newVal + key);
      return;
    }
    onChange(value + key);
    if (shifted && key.length === 1) setShifted(false);
  };

  const cls = (key: string) => {
    const b = "kb-key";
    if (key === "SPACE") return `${b} kb-space`;
    if (key === "OK") return `${b} kb-ok`;
    if (key === "⌫") return `${b} kb-back`;
    if (key === "SHIFT" || key === "shift")
      return `${b} kb-shift${shifted ? " on" : ""}`;
    if (key === "@") return `${b} kb-at`;
    if (
      [
        "@gmail",
        "@outlook",
        "@yahoo",
        "@GMAIL",
        "@OUTLOOK",
        "@YAHOO",
        ".com",
        ".COM",
      ].includes(key)
    )
      return `${b} kb-suffix`;
    return b;
  };

  const display = (key: string) =>
    key === "SPACE"
      ? "␣ espacio"
      : key === "SHIFT"
        ? "⇧"
        : key === "shift"
          ? "⇧"
          : key;

  return (
    <div className="keyboard-wrap">
      <div className="kb-rows">
        {layout.map((row, ri) => (
          <div key={ri} className="kb-row">
            {row.map((key, ki) => (
              <button
                key={`${ri}-${ki}`}
                className={cls(key)}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleKey(key);
                }}
              >
                {display(key)}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
