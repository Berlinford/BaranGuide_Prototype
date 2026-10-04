import { Text, TextProps } from "react-native";

export function AppText(props: TextProps & { className?: string }) {
  const className = props.className ?? "";

  let fontFamily = "REM_REGULAR";

  if (className.includes("REM_BOLD") || className.includes("REM_LIGHT")) {
    fontFamily = "REM_REGULAR";
  }

  return <Text {...props} style={[{ fontFamily: fontFamily }, props.style]} />;
}