export const CompilerVersions04 = [
    "0.4.13",
    "0.4.14",
    "0.4.15",
    "0.4.16",
    "0.4.17",
    "0.4.18",
    "0.4.19",
    "0.4.20",
    "0.4.21",
    "0.4.22",
    "0.4.23",
    "0.4.24",
    "0.4.25",
    "0.4.26"
];

export const CompilerVersions05 = [
    "0.5.0",
    "0.5.1",
    "0.5.2",
    "0.5.3",
    "0.5.4",
    "0.5.5",
    "0.5.6",
    "0.5.7",
    "0.5.8",
    "0.5.9",
    "0.5.10",
    "0.5.11",
    "0.5.12",
    "0.5.13",
    "0.5.14",
    "0.5.15",
    "0.5.16",
    "0.5.17"
];

export const CompilerVersions06 = [
    "0.6.0",
    "0.6.1",
    "0.6.2",
    "0.6.3",
    "0.6.4",
    "0.6.5",
    "0.6.6",
    "0.6.7",
    "0.6.8",
    "0.6.9",
    "0.6.10",
    "0.6.11",
    "0.6.12"
];

export const CompilerVersions07 = ["0.7.0", "0.7.1", "0.7.2", "0.7.3", "0.7.4", "0.7.5", "0.7.6"];

export const CompilerVersions08 = ["0.8.0", "0.8.1"];

export const CompilerSeries = [
    CompilerVersions04,
    CompilerVersions05,
    CompilerVersions06,
    CompilerVersions07,
    CompilerVersions08
];

export const CompilerVersions = [
    ...CompilerVersions04,
    ...CompilerVersions05,
    ...CompilerVersions06,
    ...CompilerVersions07,
    ...CompilerVersions08
];

export const LatestCompilerVersion = CompilerVersions[CompilerVersions.length - 1];

export const compilerMapping = new Map<string, string>([
    ["0.8.1", "soljson-v0.8.1+commit.df193b15.js"],
    ["0.8.0", "soljson-v0.8.0+commit.c7dfd78e.js"],
    ["0.7.6", "soljson-v0.7.6+commit.7338295f.js"],
    ["0.7.5", "soljson-v0.7.5+commit.eb77ed08.js"],
    ["0.7.4", "soljson-v0.7.4+commit.3f05b770.js"],
    ["0.7.3", "soljson-v0.7.3+commit.9bfce1f6.js"],
    ["0.7.2", "soljson-v0.7.2+commit.51b20bc0.js"],
    ["0.7.1", "soljson-v0.7.1+commit.f4a555be.js"],
    ["0.7.0", "soljson-v0.7.0+commit.9e61f92b.js"],
    ["0.6.12", "soljson-v0.6.12+commit.27d51765.js"],
    ["0.6.11", "soljson-v0.6.11+commit.5ef660b1.js"],
    ["0.6.10", "soljson-v0.6.10+commit.00c0fcaf.js"],
    ["0.6.9", "soljson-v0.6.9+commit.3e3065ac.js"],
    ["0.6.8", "soljson-v0.6.8+commit.0bbfe453.js"],
    ["0.6.7", "soljson-v0.6.7+commit.b8d736ae.js"],
    ["0.6.6", "soljson-v0.6.6+commit.6c089d02.js"],
    ["0.6.5", "soljson-v0.6.5+commit.f956cc89.js"],
    ["0.6.4", "soljson-v0.6.4+commit.1dca32f3.js"],
    ["0.6.3", "soljson-v0.6.3+commit.8dda9521.js"],
    ["0.6.2", "soljson-v0.6.2+commit.bacdbe57.js"],
    ["0.6.1", "soljson-v0.6.1+commit.e6f7d5a4.js"],
    ["0.6.0", "soljson-v0.6.0+commit.26b70077.js"],
    ["0.5.17", "soljson-v0.5.17+commit.d19bba13.js"],
    ["0.5.16", "soljson-v0.5.16+commit.9c3226ce.js"],
    ["0.5.15", "soljson-v0.5.15+commit.6a57276f.js"],
    ["0.5.14", "soljson-v0.5.14+commit.01f1aaa4.js"],
    ["0.5.13", "soljson-v0.5.13+commit.5b0b510c.js"],
    ["0.5.12", "soljson-v0.5.12+commit.7709ece9.js"],
    ["0.5.11", "soljson-v0.5.11+commit.22be8592.js"],
    ["0.5.10", "soljson-v0.5.10+commit.5a6ea5b1.js"],
    ["0.5.9", "soljson-v0.5.9+commit.c68bc34e.js"],
    ["0.5.8", "soljson-v0.5.8+commit.23d335f2.js"],
    ["0.5.7", "soljson-v0.5.7+commit.6da8b019.js"],
    ["0.5.6", "soljson-v0.5.6+commit.b259423e.js"],
    ["0.5.5", "soljson-v0.5.5+commit.47a71e8f.js"],
    ["0.5.4", "soljson-v0.5.4+commit.9549d8ff.js"],
    ["0.5.3", "soljson-v0.5.3+commit.10d17f24.js"],
    ["0.5.2", "soljson-v0.5.2+commit.1df8f40c.js"],
    ["0.5.1", "soljson-v0.5.1+commit.c8a2cb62.js"],
    ["0.5.0", "soljson-v0.5.0+commit.1d4f565a.js"],
    ["0.4.26", "soljson-v0.4.26+commit.4563c3fc.js"],
    ["0.4.25", "soljson-v0.4.25+commit.59dbf8f1.js"],
    ["0.4.24", "soljson-v0.4.24+commit.e67f0147.js"],
    ["0.4.23", "soljson-v0.4.23+commit.124ca40d.js"],
    ["0.4.22", "soljson-v0.4.22+commit.4cb486ee.js"],
    ["0.4.21", "soljson-v0.4.21+commit.dfe3193c.js"],
    ["0.4.20", "soljson-v0.4.20+commit.3155dd80.js"],
    ["0.4.19", "soljson-v0.4.19+commit.c4cbbb05.js"],
    ["0.4.18", "soljson-v0.4.18+commit.9cf6e910.js"],
    ["0.4.17", "soljson-v0.4.17+commit.bdeb9e52.js"],
    ["0.4.16", "soljson-v0.4.16+commit.d7661dd9.js"],
    ["0.4.15", "soljson-v0.4.15+commit.8b45bddb.js"],
    ["0.4.14", "soljson-v0.4.14+commit.c2215d46.js"],
    ["0.4.13", "soljson-v0.4.13+commit.0fb4cb1a.js"]
]);
