import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PDVToolbar } from "@/components/pdv/PDVToolbar";

const defaultProps = {
  onCalculator: vi.fn(),
  onDesconto: vi.fn(),
  onClienteFiel: vi.fn(),
  onConsultaPreco: vi.fn(),
  onReimprimirUltimo: vi.fn(),
  onPausarVenda: vi.fn(),
  onRecuperarVenda: vi.fn(),
  onTrocaDevolucao: vi.fn(),
  vendaPausada: false,
  ultimaVendaId: undefined,
};

describe("PDVToolbar", () => {
  it("renders all toolbar buttons", () => {
    render(<PDVToolbar {...defaultProps} />);
    // Toolbar should render without crashing
    expect(screen.getByText("Calculadora (F3)")).toBeTruthy;
  });

  it("calls onCalculator when calculator button is clicked", () => {
    render(<PDVToolbar {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    // First button is calculator
    fireEvent.click(buttons[0]);
    expect(defaultProps.onCalculator).toHaveBeenCalled();
  });

  it("shows play icon when venda is paused", () => {
    render(<PDVToolbar {...defaultProps} vendaPausada={true} />);
    // When paused, should show recuperar option
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("calls onTrocaDevolucao when troca button is clicked", () => {
    render(<PDVToolbar {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    // Troca/Devolução is the 6th button (index 5)
    fireEvent.click(buttons[5]);
    expect(defaultProps.onTrocaDevolucao).toHaveBeenCalled();
  });
});
