// Own entry for the 2026-09-28 Ellenton reel, so src/Root.tsx is never edited.
import { registerRoot } from "remotion";
import "../../index.css";
// Side effect: registers the brand fonts.
import "../../lib/fonts";
import { EllentonRoot } from "./Root";

registerRoot(EllentonRoot);
