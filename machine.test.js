import { beforeEach, describe, expect, it, vi } from "vitest";
import Machine from "./machine";
import readline from "readline/promises";

const mockQuestion = vi.fn();
const mockClose = vi.fn();

describe("machine", () => {
  let slotMachine;
  let readlineMock;
  beforeEach(() => {
    vi.restoreAllMocks();
    slotMachine = new Machine();
    console.log = vi.fn();

    readlineMock = vi.spyOn(readline, "createInterface").mockReturnValue({
      question: mockQuestion,
      close: mockClose,
    });
  });

  describe("#isJackpot", () => {
    it("returns true if all slots are the same", () => {
      const slots = ["A", "A", "A", "A"];
      expect(slotMachine.isJackpot(slots)).toBe(true);
    });
    it("returns false if all slots are not the same", () => {
      const slots = ["A", "A", "A", "B"];
      expect(slotMachine.isJackpot(slots)).toBe(false);
    });
  });

  describe("#isAllDifferent", () => {
    it("returns true when all slots are different", () => {
      const slots = ["A", "B", "C", "D"];
      expect(slotMachine.isAllDifferent(slots)).toBe(true);
    });

    it("returns false when any two slots are the same", () => {
      const slots = ["A", "B", "C", "C"];
      expect(slotMachine.isAllDifferent(slots)).toBe(false);
    });
  });

  describe("#isDouble", () => {
    it("returns true when two adjacent slots are the same", () => {
      const slotsArr = [
        ["A", "A", "B", "C"],
        ["A", "B", "B", "C"],
        ["A", "B", "C", "C"],
        ["B", "A", "A", "A"],
        ["A", "A", "A", "B"],
        ["A", "B", "B", "A"],
      ];
      slotsArr.forEach((slots) => {
        expect(slotMachine.isDouble(slots)).toBe(true);
      });
    });

    it("returns false when all slots are different", () => {
      const slots = ["A", "B", "C", "D"];
      expect(slotMachine.isDouble(slots)).toBe(false);
    });
  });

  describe("#isPayable", () => {
    it("returns true when the prize pot is greater than the cost of play", () => {
      slotMachine.state.prizePot = 1;
      expect(slotMachine.isPayable(1)).toBe(true);
    });

    it("returns false when the prize pot is less than the cost of play", () => {
      slotMachine.state.prizePot = 1;
      expect(slotMachine.isPayable(2)).toBe(false);
    });
  });

  describe("#isFreePlay", () => {
    it("returns true when there are free plays available", () => {
      slotMachine.state.freePlays = 1;
      expect(slotMachine.isFreePlay()).toBe(true);
    });

    it("returns false when there are no free plays available", () => {
      slotMachine.state.freePlays = 0;
      expect(slotMachine.isFreePlay()).toBe(false);
    });
  });

  describe("#takePayment", () => {
    it("decrements the free plays when there are free plays available", () => {
      slotMachine.state.freePlays = 1;
      slotMachine.state.playerCash = 10;
      slotMachine.takePayment();
      expect(slotMachine.state.freePlays).toBe(0);
      expect(slotMachine.state.playerCash).toBe(10);
    });

    it("decrements the player cash when there are no free plays available", () => {
      slotMachine.state.freePlays = 0;
      slotMachine.state.playerCash = 1;
      slotMachine.takePayment();
      expect(slotMachine.state.playerCash).toBe(0.8);
      expect(slotMachine.state.freePlays).toBe(0);
    });
  });

  describe("#giveWinnings", () => {
    it("adds the winnings to the player cash", () => {
      slotMachine.state.playerCash = 1;
      slotMachine.giveWinnings(1);
      expect(slotMachine.state.playerCash).toBe(2);
    });

    it("removes the winnings from the prizePot", () => {
      slotMachine.state.prizePot = 2;
      slotMachine.giveWinnings(1);
      expect(slotMachine.state.prizePot).toBe(1);
    });

    it("increases the free plays when the prize pot can't pay", () => {
      slotMachine.state.prizePot = 1;
      slotMachine.giveWinnings(20);
      expect(slotMachine.state.prizePot).toBe(1);
      expect(slotMachine.state.freePlays).toBe(4);
    });
  });

  describe("#getResult", () => {
    it("pays the jackpot", () => {
      slotMachine.state.playerCash = 0;
      slotMachine.state.prizePot = 20;
      const slots = ["A", "A", "A", "A"];
      slotMachine.getResult(slots);
      expect(slotMachine.state.playerCash).toBe(20);
      expect(slotMachine.state.prizePot).toBe(0);
      expect(slotMachine.state.currentGame.winnings).toBe(20);
    });
    it("pays the double", () => {
      slotMachine.state.playerCash = 0;
      slotMachine.state.prizePot = 20;
      const slots = ["A", "A", "B", "B"];
      slotMachine.getResult(slots);
      expect(slotMachine.state.playerCash).toBe(1);
      expect(slotMachine.state.prizePot).toBe(19);
      expect(slotMachine.state.currentGame.winnings).toBe(1);
    });
    it("pays the all different", () => {
      const slotsArr = [
        ["D", "C", "E", "B"],
        ["A", "B", "C", "D"],
      ];
      slotsArr.forEach((slots) => {
        slotMachine.state.playerCash = 0;
        slotMachine.state.prizePot = 20;
        slotMachine.getResult(slots);
        expect(slotMachine.state.playerCash).toBe(10);
        expect(slotMachine.state.prizePot).toBe(10);
        expect(slotMachine.state.currentGame.winnings).toBe(10);
      });
    });
    it("pays nothing", () => {
      slotMachine.state.playerCash = 0;
      slotMachine.state.prizePot = 20;
      const slots = ["A", "B", "A", "B"];
      slotMachine.getResult(slots);
      expect(slotMachine.state.playerCash).toBe(0);
      expect(slotMachine.state.prizePot).toBe(20);
      expect(slotMachine.state.currentGame.winnings).toBe(0);
    });
  });

  describe("#askQuestion", () => {
    it("asks the user a question", async () => {
      mockQuestion.mockResolvedValueOnce("y");
      const answer = await slotMachine.askQuestion("Do you want to play?");
      expect(answer).toBe("y");
      expect(mockQuestion).toHaveBeenCalledWith("Do you want to play?");
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe("#play", () => {
    it("plays a game", async () => {
      mockQuestion.mockResolvedValueOnce(10).mockResolvedValueOnce("n");
      await slotMachine.play();
      expect(mockQuestion).toHaveBeenNthCalledWith(
        1,
        "How much money would you like to start with? "
      );
      expect(mockQuestion).toHaveBeenNthCalledWith(
        2,
        "Would you like to play again? y/n "
      );
      expect(mockClose).toHaveBeenCalled();
    });

    it("plays a game with free plays", async () => {
      mockQuestion.mockResolvedValueOnce(10).mockResolvedValueOnce("n");
      slotMachine.state.freePlays = 1;
      await slotMachine.play();
      expect(slotMachine.state.freePlays).toBe(0);
    });

    it("awards a jackpot", async () => {
      mockQuestion.mockResolvedValueOnce(10).mockResolvedValueOnce("n");
      slotMachine.state.characters = ["A", "A", "A", "A", "A"];
      await slotMachine.play();
      expect(slotMachine.state.currentGame.winnings).toBe(20);
    });

    it("awards a double", async () => {
      mockQuestion.mockResolvedValueOnce(10).mockResolvedValueOnce("n");
      slotMachine.getSlots = vi.fn().mockReturnValueOnce(["A", "B", "B", "C"]);
      await slotMachine.play();
      expect(slotMachine.state.currentGame.winnings).toBe(1);
    });

    it("awards all different", async () => {
      mockQuestion.mockReturnValueOnce(10).mockReturnValueOnce("n");
      slotMachine.getSlots = vi.fn().mockReturnValueOnce(["A", "B", "C", "D"]);
      await slotMachine.play();
      expect(slotMachine.state.currentGame.winnings).toBe(10);
    });

    it("awards nothing", async () => {
      mockQuestion.mockReturnValueOnce(10).mockReturnValueOnce("n");
      slotMachine.getSlots = vi.fn().mockReturnValueOnce(["A", "B", "C", "B"]);
      await slotMachine.play();
      expect(slotMachine.state.currentGame.winnings).toBe(0);
    });

    it("plays multiple games", async () => {
      mockQuestion
        .mockReturnValueOnce(10)
        .mockReturnValueOnce("y")
        .mockReturnValueOnce("n");

      slotMachine.getSlots = vi
        .fn()
        .mockReturnValueOnce(["A", "B", "C", "B"])
        .mockReturnValueOnce(["A", "A", "A", "A"]);
      await slotMachine.play();
      expect(slotMachine.state.playerCash).toBe(29.6);
    });
  });
});
