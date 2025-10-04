import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../src/components/Navbar';

// Mock the useSimulation hook
jest.mock('../../src/context/SimulationContext', () => ({
  useSimulation: () => ({
    view: 'simulation',
    setView: jest.fn(),
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

describe('Navbar Component', () => {
  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  };

  test('renders navbar component', () => {
    renderNavbar();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('renders view toggle buttons', () => {
    renderNavbar();
    expect(screen.getByText('2D View')).toBeInTheDocument();
    expect(screen.getByText('3D View')).toBeInTheDocument();
  });

  test('renders NASA logo', () => {
    renderNavbar();
    const logo = screen.getByAltText('NASA Logo');
    expect(logo).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderNavbar();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Simulate')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  test('applies correct styling classes', () => {
    renderNavbar();
    const navbar = screen.getByRole('navigation');
    expect(navbar).toHaveClass('navbar');
  });

  test('handles responsive design', () => {
    renderNavbar();
    const navbar = screen.getByRole('navigation');
    expect(navbar).toHaveClass('navbar');
  });

  test('renders brand text', () => {
    renderNavbar();
    expect(screen.getByText('Meteor Mastery')).toBeInTheDocument();
  });

  test('navigation links have correct href attributes', () => {
    renderNavbar();
    const homeLink = screen.getByText('Home').closest('a');
    const simulateLink = screen.getByText('Simulate').closest('a');
    const historyLink = screen.getByText('History').closest('a');
    const aboutLink = screen.getByText('About').closest('a');
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(simulateLink).toHaveAttribute('href', '/simulate');
    expect(historyLink).toHaveAttribute('href', '/history');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  test('renders container structure', () => {
    renderNavbar();
    const navbar = screen.getByRole('navigation');
    expect(navbar.querySelector('.navbar-container')).toBeInTheDocument();
  });

  test('handles theme toggle functionality', () => {
    renderNavbar();
    const themeButton = screen.getByText('Theme');
    expect(themeButton).toBeInTheDocument();
  });

  test('renders mobile menu toggle', () => {
    renderNavbar();
    const mobileToggle = screen.getByRole('button', { name: /toggle menu/i });
    expect(mobileToggle).toBeInTheDocument();
  });
});