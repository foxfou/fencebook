// Larry's shipments data, read at build time (pages are static). Server code only: client components get what they need as props.
import shipmentsJson from "../../data/catalog/shipments.json";
import { buildGraph, type ShipmentsData } from "./shipments";

export const shipmentsData = shipmentsJson as unknown as ShipmentsData;
export const shipmentsGraph = buildGraph(shipmentsData.nodes);
