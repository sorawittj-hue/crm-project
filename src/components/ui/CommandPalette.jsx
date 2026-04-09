import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';

/**
 * Global Command Palette (Omni-search)
 * Triggered by Cmd+K (Mac) or Ctrl+K (Windows)
 */
export default function CommandPalette({ isOpen, onClose, deals = [], customers = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle is handled by parent
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelect = useCallback((path) => {
    navigate(path);
    onClose();
    setSearch('');
  }, [navigate, onClose]);

  const handleDealSelect = useCallback((dealId) => {
    navigate(`/pipeline?deal=${dealId}`);
    onClose();
    setSearch('');
  }, [navigate, onClose]);

  const actions = [
    {
      id: 'dashboard',
      name: 'Go to Dashboard',
      icon: '📊',
      action: () => handleSelect('/command'),
    },
    {
      id: 'pipeline',
      name: 'Go to Pipeline',
      icon: '📋',
      action: () => handleSelect('/pipeline'),
    },
    {
      id: 'customers',
      name: 'Go to Customers',
      icon: '👥',
      action: () => handleSelect('/customers'),
    },
    {
      id: 'analytics',
      name: 'Go to Analytics',
      icon: '📈',
      action: () => handleSelect('/analytics'),
    },
    {
      id: 'tools',
      name: 'Go to Tools',
      icon: '🔧',
      action: () => handleSelect('/tools'),
    },
    {
      id: 'dark-mode',
      name: 'Toggle Dark Mode',
      icon: '🌙',
      action: () => {
        document.documentElement.classList.toggle('dark');
        onClose();
      },
    },
    {
      id: 'create-deal',
      name: 'Create New Deal',
      icon: '➕',
      action: () => {
        navigate('/pipeline?new=true');
        onClose();
        setSearch('');
      },
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.overlay}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={styles.dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <Command style={styles.command} className="command-palette">
              <div style={styles.searchContainer}>
                <span style={styles.searchIcon}>🔍</span>
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search deals, customers, or commands..."
                  style={styles.input}
                  autoFocus
                />
                <kbd style={styles.kbd}>ESC</kbd>
              </div>

              <Command.List style={styles.list}>
                <Command.Empty style={styles.empty}>
                  No results found.
                </Command.Empty>

                {/* Quick Actions */}
                <Command.Group heading="Quick Actions" style={styles.group}>
                  {actions.map((action) => (
                    <Command.Item
                      key={action.id}
                      value={action.name}
                      onSelect={action.action}
                      style={styles.item}
                    >
                      <span style={styles.itemIcon}>{action.icon}</span>
                      <span style={styles.itemText}>{action.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Deals */}
                {deals.length > 0 && (
                  <Command.Group heading="Deals" style={styles.group}>
                    {deals.slice(0, 5).map((deal) => (
                      <Command.Item
                        key={deal.id}
                        value={`${deal.title} ${deal.company || ''}`}
                        onSelect={() => handleDealSelect(deal.id)}
                        style={styles.item}
                      >
                        <span style={styles.itemIcon}>📋</span>
                        <span style={styles.itemText}>
                          {deal.title}
                          {deal.company && (
                            <span style={styles.itemSecondary}> — {deal.company}</span>
                          )}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Customers */}
                {customers.length > 0 && (
                  <Command.Group heading="Customers" style={styles.group}>
                    {customers.slice(0, 5).map((customer) => (
                      <Command.Item
                        key={customer.id}
                        value={`${customer.name} ${customer.email || ''}`}
                        onSelect={() => handleSelect('/customers')}
                        style={styles.item}
                      >
                        <span style={styles.itemIcon}>👤</span>
                        <span style={styles.itemText}>
                          {customer.name}
                          {customer.email && (
                            <span style={styles.itemSecondary}> — {customer.email}</span>
                          )}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>

            {/* Footer */}
            <div style={styles.footer}>
              <span><kbd>↑↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Select</span>
              <span><kbd>esc</kbd> Close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '15vh',
  },
  dialog: {
    width: '100%',
    maxWidth: '600px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  },
  command: {
    outline: 'none',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    gap: '12px',
  },
  searchIcon: {
    fontSize: '18px',
    opacity: 0.5,
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    backgroundColor: 'transparent',
    color: '#333',
  },
  kbd: {
    padding: '4px 8px',
    fontSize: '11px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
    color: '#666',
    fontFamily: 'monospace',
  },
  list: {
    maxHeight: '400px',
    overflow: 'auto',
    padding: '8px',
  },
  empty: {
    padding: '24px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
  },
  group: {
    marginBottom: '8px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333',
    transition: 'background-color 0.15s',
  },
  itemIcon: {
    fontSize: '16px',
    width: '24px',
    textAlign: 'center',
  },
  itemText: {
    flex: 1,
  },
  itemSecondary: {
    color: '#999',
    fontSize: '13px',
  },
  footer: {
    display: 'flex',
    gap: '16px',
    padding: '12px 20px',
    borderTop: '1px solid #f0f0f0',
    backgroundColor: '#fafafa',
    fontSize: '12px',
    color: '#999',
  },
};

export default CommandPalette;
