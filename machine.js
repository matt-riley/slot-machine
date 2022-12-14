import readline from "readline/promises";
class Machine {
  state = {
    characters: ["A", "B", "C", "D", "E"],
    costOfPlay: 0.2,
    prizePot: 20,
    playerCash: 0,
    freePlays: 0,
    jackpot: 20,
    allDifferent: 10,
    double: 5 * 0.2,
    playAgain: true,
    currentGame: {
      winnings: 0,
      freePlays: 0,
    },
  };

  spin() {
    return this.state.characters[
      Math.floor(Math.random() * this.state.characters.length)
    ];
  }

  getSlots() {
    return [this.spin(), this.spin(), this.spin(), this.spin()];
  }

  isJackpot(slots) {
    return slots.every((slot) => slot === slots[0]);
  }

  isAllDifferent(slots) {
    const unique = [...new Set(slots)];
    return unique.length === slots.length;
  }

  isDouble(slots) {
    return (
      slots[0] === slots[1] || slots[1] === slots[2] || slots[2] === slots[3]
    );
  }

  isPayable(amt) {
    return this.state.prizePot >= amt;
  }

  isFreePlay() {
    return this.state.freePlays > 0;
  }

  takePayment() {
    if (this.isFreePlay()) {
      this.state.freePlays--;
      return;
    }
    this.state.playerCash = parseFloat(
      (this.state.playerCash - this.state.costOfPlay).toFixed(2)
    );
    this.state.prizePot = parseFloat(
      (this.state.prizePot + this.state.costOfPlay).toFixed(2)
    );
  }

  giveWinnings(amt) {
    if (this.isPayable(amt)) {
      this.state.prizePot -= amt;
      this.state.playerCash += amt;
      this.state.currentGame.winnings = amt;
      this.state.currentGame.freePlays = 0;
    } else {
      const freePlays = parseInt(amt * this.state.costOfPlay);
      this.state.freePlays += freePlays;
      this.state.currentGame.winnings = 0;
      this.state.currentGame.freePlays = freePlays;
    }
  }

  getResult(slots) {
    if (this.isJackpot(slots)) {
      this.giveWinnings(this.state.jackpot);
      return;
    } else if (this.isAllDifferent(slots)) {
      this.giveWinnings(this.state.allDifferent);
      return;
    } else if (this.isDouble(slots)) {
      this.giveWinnings(this.state.double);
      return;
    } else {
      this.state.currentGame.winnings = 0;
      this.state.currentGame.freePlays = 0;
      return;
    }
  }

  async askQuestion(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const response = await rl.question(question);
    rl.close();
    return response;
  }

  async playAgain() {
    const response = await this.askQuestion(
      "Would you like to play again? y/n "
    );
    return response.toLowerCase() === "y";
  }

  async play() {
    console.clear();
    this.state.playerCash = parseInt(
      await this.askQuestion("How much money would you like to start with? ")
    );
    do {
      console.clear();
      const slots = this.getSlots();
      console.log(`The prize pot is £${this.state.prizePot}.`);
      console.log(slots);
      this.takePayment();
      this.getResult(slots);
      console.log(`You won £${this.state.currentGame.winnings}.`);
      console.log(`You have ${this.state.currentGame.freePlays} free plays.`);
      console.log(`You have £${this.state.playerCash} in the bank.`);
      console.log(`Free plays: ${this.state.freePlays}`);
      this.state.playAgain = await this.playAgain();
    } while (this.state.playerCash > 0 && this.state.playAgain);
  }
}

export default Machine;
