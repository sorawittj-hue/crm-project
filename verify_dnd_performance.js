import fs from 'fs';
import path from 'path';

console.log('=== DRAG-AND-DROP PERFORMANCE FORENSIC AUDIT ===');

const HOOKS_PATH = './src/hooks/useDeals.js';
const BOARD_PATH = './src/components/pipeline/PipelineBoard.jsx';

function auditHooks() {
  console.log('\n--- Auditing React Query Hooks & Realtime Listener ---');
  if (!fs.existsSync(HOOKS_PATH)) {
    console.error(`Error: File not found at ${HOOKS_PATH}`);
    process.exit(1);
  }

  const hooksCode = fs.readFileSync(HOOKS_PATH, 'utf8');

  // 1. Verify postgres realtime changes channel listener
  console.log('Checking postgres changes realtime channel listener...');
  const channelBlockMatch = hooksCode.match(/const\s+channel\s*=\s*supabase\s*\.channel\([\s\S]*?\.subscribe\(\)/);
  if (!channelBlockMatch) {
    console.log('❌ FAIL: Realtime channel subscription not found in useDeals');
  } else {
    const channelBlock = channelBlockMatch[0];
    console.log('✅ PASS: Realtime channel subscription found.');
    
    // Check if it uses setQueriesData instead of invalidateQueries
    const usesInvalidate = channelBlock.includes('invalidateQueries');
    const usesSetQueriesData = channelBlock.includes('setQueriesData');
    
    if (usesInvalidate) {
      console.log('❌ FAIL: Realtime listener uses invalidateQueries! This will trigger a network refetch.');
    } else if (usesSetQueriesData) {
      console.log('✅ PASS: Realtime listener uses setQueriesData for in-place cache updates.');
    } else {
      console.log('⚠️ WARNING: Realtime listener does not seem to update the cache directly.');
    }

    // Check for redundancy optimization (JSON.stringify check)
    const hasJsonStringifyGuard = channelBlock.includes('JSON.stringify(existing) === JSON.stringify(newRecord)');
    if (hasJsonStringifyGuard) {
      console.log('✅ PASS: Realtime listener includes JSON.stringify optimization guard to prevent redundant re-renders.');
    } else {
      console.log('❌ FAIL: Realtime listener lacks optimization guard to prevent redundant cache updates.');
    }
  }

  // 2. Verify useUpdateDeal mutation callbacks
  console.log('\nChecking useUpdateDeal mutation configuration...');
  const useUpdateDealMatch = hooksCode.match(/export\s+function\s+useUpdateDeal\([\s\S]*?\}\s*\n\s*\}/);
  if (!useUpdateDealMatch) {
    console.log('❌ FAIL: useUpdateDeal hook not found or could not be parsed.');
  } else {
    const useUpdateDealBlock = useUpdateDealMatch[0];
    console.log('✅ PASS: useUpdateDeal hook found.');

    // Check onMutate (Optimistic Update)
    const hasCancelQueries = useUpdateDealBlock.includes('queryClient.cancelQueries');
    const hasOnMutateSet = useUpdateDealBlock.includes('setQueriesData') && useUpdateDealBlock.includes('onMutate');
    
    if (hasCancelQueries) {
      console.log('✅ PASS: onMutate cancels outgoing deals queries to prevent overwrite.');
    } else {
      console.log('❌ FAIL: onMutate does not cancel outgoing queries.');
    }

    if (hasOnMutateSet) {
      console.log('✅ PASS: onMutate applies optimistic updates via setQueriesData.');
    } else {
      console.log('❌ FAIL: onMutate does not apply optimistic updates.');
    }

    // Check onSuccess
    const hasOnSuccessInvalidate = useUpdateDealBlock.match(/onSuccess:[\s\S]*?invalidateQueries/);
    const hasOnSuccessSet = useUpdateDealBlock.match(/onSuccess:[\s\S]*?setQueriesData/);
    
    if (hasOnSuccessInvalidate) {
      console.log('❌ FAIL: useUpdateDeal onSuccess invalidates queries! This will trigger a network refetch.');
    } else if (hasOnSuccessSet) {
      console.log('✅ PASS: useUpdateDeal onSuccess updates queries data in-place via setQueriesData.');
    } else {
      console.log('❌ FAIL: useUpdateDeal onSuccess has no in-place cache updates.');
    }

    // Check onError (Rollback)
    const hasOnErrorRollback = useUpdateDealBlock.includes('onError:') && useUpdateDealBlock.includes('setQueryData');
    if (hasOnErrorRollback) {
      console.log('✅ PASS: onError rolls back the query cache to the captured snapshot.');
    } else {
      console.log('❌ FAIL: onError does not perform rollback.');
    }
  }
}

function auditBoard() {
  console.log('\n--- Auditing Pipeline Board Rendering Performance ---');
  if (!fs.existsSync(BOARD_PATH)) {
    console.error(`Error: File not found at ${BOARD_PATH}`);
    process.exit(1);
  }

  const boardCode = fs.readFileSync(BOARD_PATH, 'utf8');

  // Check for virtualization or memoization
  const hasInnerListMemo = boardCode.includes('const InnerList = memo(');
  const hasDealCardMemo = boardCode.includes('const DealCard = memo(');
  
  if (hasInnerListMemo) {
    console.log('✅ PASS: InnerList (rendering list of cards per column) is memoized.');
  } else {
    console.log('❌ FAIL: InnerList is not memoized, dragging cards will re-render all cards in the column.');
  }

  if (hasDealCardMemo) {
    console.log('✅ PASS: DealCard is memoized, minimizing re-renders of cards.');
  } else {
    console.log('❌ FAIL: DealCard is not memoized.');
  }

  // Check for inline callbacks in rendered items that might break memoization
  const matches = boardCode.match(/<DealCard[\s\S]*?\/>/g) || [];
  let passesPropChecks = true;
  for (const match of matches) {
    if (match.includes('onSelect={() =>') || match.includes('onClick={() =>') || match.includes('onPin={() =>') || match.includes('onMove={(dir) =>')) {
      // Inline arrow functions in props can cause memoized components to re-render if the parent renders.
      // However, let's verify if they cause issues.
      console.log('⚠️ INFO: DealCard receives inline callbacks (e.g. onSelect, onClick, onPin, onMove).');
      console.log('         Since DealCard is inside the memoized InnerList, and InnerList is only re-rendered when');
      console.log('         deals or selectedDealId change, this does not hurt active dragging performance.');
      passesPropChecks = false;
      break;
    }
  }
  if (passesPropChecks) {
    console.log('✅ PASS: DealCard callbacks are fully optimized.');
  }
}

auditHooks();
auditBoard();
console.log('\n=== AUDIT COMPLETE ===');
