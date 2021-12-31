import { Tarjan } from "../src/tarjan";

import * as mocha from "mocha";
import * as chai from "chai";
import { Random } from "../src/random";
import { expect } from "chai";

const names: string[] = [
  "Abel",
  "Archimedes",
  "Aristotle",
  "Aryabhata",
  "Babbage",
  "Banneker",
  "Bernoulli",
  "Bernoulli",
  "Bernoulli",
  "Boole",
  "Brahmagupta",
  "Brunelleschi",
  "Cantor",
  "Cauchy",
  "Cayley",
  "Cohen",
  "De Fermat",
  "De Moivre",
  "De Morgan",
  "Democritus",
  "Descartes",
  "Diophantus",
  "Einstein",
  "Eratosthenes",
  "Escher",
  "Euclid",
  "Euler",
  "Fourier",
  "Frege",
  "Galois",
  "Gauss",
  "Germain",
  "Grothendieck",
  "Gödel",
  "Halley",
  "Hamilton",
  "Hardy",
  "Heron Of Alexandria",
  "Hilbert",
  "Hipparchus",
  "Hopper",
  "Hui",
  "Khayyam",
  "Khwarizmi",
  "Klein",
  "Lagrange",
  "Laplace",
  "Lasker",
  "Leibniz",
  "Lorenz",
  "Lovelace",
  "Madhava",
  "Magnus",
  "Monge",
  "Napier",
  "Nash",
  "Newton",
  "Pacioli",
  "Pascal",
  "Peano",
  "Perelman",
  "Plato",
  "Poincaré",
  "Ptolemy",
  "Pythagoras",
  "Ramanujan",
  "Riemann",
  "Robinson",
  "Russell",
  "Taylor",
  "Thales",
  "Turing",
  "Venn",
  "Von Neumann",
  "Wallis",
  "Whitehead",
  "Wiles",
  "Witten",
];

function makeGraph() {
  let J = 20;
  let D = 0.1;
  let R = new Random(18);
  let nodes = R.shuffle<string>([...names])
    .slice(0, J)
    .sort();
  let edges: { [key: string]: string[] } = {};
  for (let f of nodes) {
    for (let t of nodes) {
      if (R.random() < D) {
        if (!(f in edges)) {
          edges[f] = [];
        }
        edges[f].push(t);
      }
    }
  }
  let T = new Tarjan(nodes, edges);
  console.log(JSON.stringify(nodes));
  console.log(JSON.stringify(edges));
  console.log(JSON.stringify(T.O));
}

it("graph 1", () => {
  const nodes: string[] = [
    "Bernoulli",
    "Cayley",
    "De Fermat",
    "Galois",
    "Gauss",
    "Hilbert",
    "Napier",
    "Newton",
    "Plato",
    "Pythagoras",
  ];
  const edges: { [key: string]: string[] } = {
    Bernoulli: ["Pythagoras"],
    Cayley: ["De Fermat"],
    "De Fermat": ["Galois", "Pythagoras"],
    Galois: ["Cayley"],
    Gauss: ["Napier", "Plato"],
    Hilbert: ["Plato", "Pythagoras"],
    Newton: ["Galois"],
    Plato: ["Hilbert"],
  };
  const SCCs: string[][] = [
    ["Pythagoras"],
    ["Bernoulli"],
    ["Cayley", "De Fermat", "Galois"],
    ["Napier"],
    ["Hilbert", "Plato"],
    ["Gauss"],
    ["Newton"],
  ];

  let T = new Tarjan(nodes, edges);
  expect(T.O).to.eql(SCCs);
});

it("graph 2", () => {
  const nodes: string[] = [
    "Banneker",
    "Bernoulli",
    "Cauchy",
    "Descartes",
    "Einstein",
    "Euler",
    "Gauss",
    "Hamilton",
    "Laplace",
    "Madhava",
    "Newton",
    "Pacioli",
    "Pythagoras",
    "Riemann",
    "Thales",
  ];
  const edges: { [key: string]: string[] } = {
    Banneker: ["Pacioli"],
    Bernoulli: ["Pacioli"],
    Einstein: ["Gauss", "Madhava"],
    Euler: ["Madhava"],
    Laplace: ["Banneker"],
    Madhava: ["Madhava", "Riemann"],
    Newton: ["Bernoulli"],
    Pacioli: ["Hamilton", "Madhava"],
    Pythagoras: ["Cauchy", "Euler"],
    Riemann: ["Descartes"],
  };
  const SCCs: string[][] = [
    ["Hamilton"],
    ["Descartes"],
    ["Riemann"],
    ["Madhava"],
    ["Pacioli"],
    ["Banneker"],
    ["Bernoulli"],
    ["Cauchy"],
    ["Gauss"],
    ["Einstein"],
    ["Euler"],
    ["Laplace"],
    ["Newton"],
    ["Pythagoras"],
    ["Thales"],
  ];

  let T = new Tarjan(nodes, edges);
  expect(T.O).to.eql(SCCs);
});

it("graph 3", () => {
  const nodes: string[] = [
    "Aryabhata",
    "Banneker",
    "Bernoulli",
    "Cauchy",
    "Descartes",
    "Einstein",
    "Euler",
    "Gauss",
    "Hamilton",
    "Laplace",
    "Madhava",
    "Nash",
    "Newton",
    "Pacioli",
    "Perelman",
    "Plato",
    "Pythagoras",
    "Riemann",
    "Robinson",
    "Thales",
  ];
  const edges: { [key: string]: string[] } = {
    Aryabhata: ["Nash", "Pacioli"],
    Banneker: ["Euler", "Pythagoras"],
    Bernoulli: ["Einstein"],
    Cauchy: ["Descartes", "Euler", "Laplace"],
    Descartes: ["Cauchy", "Descartes", "Newton"],
    Euler: ["Aryabhata", "Bernoulli"],
    Gauss: ["Descartes", "Hamilton", "Nash", "Pacioli"],
    Hamilton: ["Newton", "Perelman"],
    Laplace: ["Banneker", "Bernoulli", "Einstein", "Hamilton", "Robinson"],
    Madhava: ["Pythagoras"],
    Nash: ["Plato"],
    Newton: ["Perelman"],
    Pacioli: ["Bernoulli", "Gauss", "Pythagoras"],
    Perelman: ["Newton"],
    Riemann: ["Bernoulli", "Madhava"],
    Robinson: ["Descartes", "Pacioli", "Riemann"],
    Thales: ["Hamilton", "Laplace", "Robinson"],
  };
  const SCCs: string[][] = [
    ["Plato"],
    ["Nash"],
    ["Einstein"],
    ["Bernoulli"],
    ["Pythagoras"],
    ["Newton", "Perelman"],
    ["Hamilton"],
    ["Madhava"],
    ["Riemann"],
    [
      "Aryabhata",
      "Banneker",
      "Cauchy",
      "Descartes",
      "Euler",
      "Gauss",
      "Laplace",
      "Pacioli",
      "Robinson",
    ],
    ["Thales"],
  ];

  let T = new Tarjan(nodes, edges);
  expect(T.O).to.eql(SCCs);
});
