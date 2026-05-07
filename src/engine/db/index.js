import { BrazilDB } from './brazil';
import { SouthAmericaDB } from './south_america';
import { EuropeDB } from './europe';

export const RealDB = {
    BRA: BrazilDB,
    ...SouthAmericaDB, // ARG, URU, CHI, COL
    ...EuropeDB // ENG, ESP, ITA, GER, FRA
};
