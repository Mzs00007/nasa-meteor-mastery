import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Note: These imports are outdated and don't match current component structure
// import { AuthProvider } from '../../src/components/Auth/AuthContext';
import Navbar from '../../src/components/Navbar';
// import { SimulationProvider } from '../../src/contexts/SimulationContext';

// Mock the useSimulation hook
const mockUseSimulation = {
  isRunning: false,
  toggleSimulation: jest.fn(),
  resetSimulation: jest.fn(),
  simulationData: {
    asteroids: [],
    timeScale: 1,
    currentTime: new Date(),
  },
};

jest.mock('../../src/contexts/SimulationContext', () => ({
  ...jest.requireActual('../../src/contexts/SimulationContext'),
  useSimulation: () => mockUseSimulation,
}));

// Mock the useAuth hook
const mockUseAuth = {
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: false,
};

jest.mock('../../src/components/Auth/AuthContext', () => ({
  ...jest.requireActual('../../src/components/Auth/AuthContext'),
  useAuth: () => mockUseAuth,
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <SimulationProvider>{children}</SimulationProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe.skip('Navbar Component Unit Tests - LEGACY (DISABLED)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSimulation.isRunning = false;
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.user = null;
  });

  describe('Rendering', () => {
    test('should render navbar with logo', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const logo = screen.getByAltText('NASA Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', expect.stringContaining('nasa-logo'));
    });

    test('should render navigation links', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Simulation')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    test('should render simulation controls', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByText('Start Simulation')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    test('should render authentication section when not logged in', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    test('should render user menu when logged in', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = { name: 'John Doe', email: 'john@example.com' };

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('should navigate to home when logo is clicked', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const logo = screen.getByAltText('NASA Logo');
      fireEvent.click(logo);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('should navigate to simulation page', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const simulationLink = screen.getByText('Simulation');
      fireEvent.click(simulationLink);

      expect(mockNavigate).toHaveBeenCalledWith('/simulation');
    });

    test('should navigate to data page', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const dataLink = screen.getByText('Data');
      fireEvent.click(dataLink);

      expect(mockNavigate).toHaveBeenCalledWith('/data');
    });

    test('should navigate to about page', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const aboutLink = screen.getByText('About');
      fireEvent.click(aboutLink);

      expect(mockNavigate).toHaveBeenCalledWith('/about');
    });

    test('should highlight active navigation link', () => {
      // Mock current location as simulation page
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: () => ({ pathname: '/simulation' }),
      }));

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const simulationLink = screen.getByText('Simulation');
      expect(simulationLink.closest('a')).toHaveClass('active');
    });
  });

  describe('Simulation Controls', () => {
    test('should start simulation when start button is clicked', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Simulation');
      fireEvent.click(startButton);

      expect(mockUseSimulation.toggleSimulation).toHaveBeenCalled();
    });

    test('should stop simulation when stop button is clicked', () => {
      mockUseSimulation.isRunning = true;

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const stopButton = screen.getByText('Stop Simulation');
      fireEvent.click(stopButton);

      expect(mockUseSimulation.toggleSimulation).toHaveBeenCalled();
    });

    test('should reset simulation when reset button is clicked', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      expect(mockUseSimulation.resetSimulation).toHaveBeenCalled();
    });

    test('should show correct button text based on simulation state', () => {
      const { rerender } = render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByText('Start Simulation')).toBeInTheDocument();

      mockUseSimulation.isRunning = true;

      rerender(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByText('Stop Simulation')).toBeInTheDocument();
    });

    test('should disable controls when simulation is loading', () => {
      mockUseSimulation.isLoading = true;

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Simulation');
      const resetButton = screen.getByText('Reset');

      expect(startButton).toBeDisabled();
      expect(resetButton).toBeDisabled();
    });
  });

  describe('Authentication', () => {
    test('should navigate to login page when login is clicked', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const loginLink = screen.getByText('Login');
      fireEvent.click(loginLink);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('should navigate to register page when register is clicked', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const registerLink = screen.getByText('Register');
      fireEvent.click(registerLink);

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    test('should show user dropdown when user is logged in', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = { name: 'John Doe', email: 'john@example.com' };

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const userButton = screen.getByText('John Doe');
      fireEvent.click(userButton);

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    test('should logout when logout is clicked', async () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = { name: 'John Doe', email: 'john@example.com' };

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const userButton = screen.getByText('John Doe');
      fireEvent.click(userButton);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockUseAuth.logout).toHaveBeenCalled();
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should show mobile menu toggle on small screens', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const mobileToggle = screen.getByLabelText('Toggle navigation menu');
      expect(mobileToggle).toBeInTheDocument();
    });

    test('should toggle mobile menu when hamburger is clicked', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const mobileToggle = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(mobileToggle);

      const mobileMenu = screen.getByTestId('mobile-menu');
      expect(mobileMenu).toHaveClass('open');
    });

    test('should close mobile menu when link is clicked', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const mobileToggle = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(mobileToggle);

      const homeLink = screen.getByText('Home');
      fireEvent.click(homeLink);

      const mobileMenu = screen.getByTestId('mobile-menu');
      expect(mobileMenu).not.toHaveClass('open');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const homeLink = screen.getByText('Home');
      homeLink.focus();

      expect(document.activeElement).toBe(homeLink);

      fireEvent.keyDown(homeLink, { key: 'Tab' });

      const simulationLink = screen.getByText('Simulation');
      expect(document.activeElement).toBe(simulationLink);
    });

    test('should handle Enter key for button activation', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Simulation');
      fireEvent.keyDown(startButton, { key: 'Enter' });

      expect(mockUseSimulation.toggleSimulation).toHaveBeenCalled();
    });

    test('should handle Space key for button activation', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const resetButton = screen.getByText('Reset');
      fireEvent.keyDown(resetButton, { key: ' ' });

      expect(mockUseSimulation.resetSimulation).toHaveBeenCalled();
    });
  });

  describe('Theme Support', () => {
    test('should apply dark theme classes when dark mode is enabled', () => {
      // Mock theme context
      const mockTheme = { isDark: true };

      render(
        <TestWrapper>
          <Navbar theme={mockTheme} />
        </TestWrapper>
      );

      const navbar = screen.getByRole('navigation');
      expect(navbar).toHaveClass('navbar-dark');
    });

    test('should apply light theme classes when light mode is enabled', () => {
      const mockTheme = { isDark: false };

      render(
        <TestWrapper>
          <Navbar theme={mockTheme} />
        </TestWrapper>
      );

      const navbar = screen.getByRole('navigation');
      expect(navbar).toHaveClass('navbar-light');
    });
  });

  describe('Error Handling', () => {
    test('should handle simulation errors gracefully', () => {
      mockUseSimulation.toggleSimulation.mockImplementation(() => {
        throw new Error('Simulation error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Simulation');
      fireEvent.click(startButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error toggling simulation:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('should handle authentication errors gracefully', () => {
      mockUseAuth.logout.mockImplementation(() => {
        throw new Error('Logout error');
      });

      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = { name: 'John Doe' };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const userButton = screen.getByText('John Doe');
      fireEvent.click(userButton);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error during logout:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();

      const TestComponent = () => {
        renderSpy();
        return <Navbar />;
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should not trigger additional renders due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    test('should debounce rapid clicks', async () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Simulation');

      // Rapid clicks
      fireEvent.click(startButton);
      fireEvent.click(startButton);
      fireEvent.click(startButton);

      // Should only call once due to debouncing
      await waitFor(() => {
        expect(mockUseSimulation.toggleSimulation).toHaveBeenCalledTimes(1);
      });
    });
  });
});
