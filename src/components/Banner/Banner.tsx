import React from 'react';
import { Stack, Text, MessageBar, MessageBarType, PrimaryButton, IStackTokens } from '@fluentui/react';
import { ActiveBreakInfo } from '../../types'; // Adjust path as necessary

interface BannerProps {
  activeBreaks: ActiveBreakInfo[];
  onEndBreak: (agentId: string, slotId: string) => void; // Changed to pass agentId and slotId
}

const bannerStackTokens: IStackTokens = { childrenGap: 10 };
const agentStackTokens: IStackTokens = { childrenGap: 5 };

const Banner: React.FC<BannerProps> = ({ activeBreaks, onEndBreak }) => {
  if (!activeBreaks || activeBreaks.length === 0) { // Added a check for undefined activeBreaks
    return null; // Don't render anything if no one is on break
  }

  return (
    <MessageBar messageBarType={MessageBarType.info} isMultiline={true}>
      <Stack tokens={bannerStackTokens}>
        <Text variant="large" styles={{ root: { fontWeight: 600 } }}>Currently on Break:</Text>
        <Stack horizontal wrap tokens={{ childrenGap: 20 }}>
          {activeBreaks.map((breakInfo) => (
            <Stack 
              key={breakInfo.agentId + '-' + breakInfo.slotId} // Use a more unique key if slotId might not be unique across agents over time (though for active breaks it should be fine)
              horizontal 
              verticalAlign="center" 
              tokens={agentStackTokens}
              styles={{ root: { padding: '5px 10px', backgroundColor: '#f3f2f1', borderRadius: 4 }}}
            >
              <Text variant="medium">
                {breakInfo.agentName} ({breakInfo.breakName} since {breakInfo.startTime})
              </Text>
              <PrimaryButton 
                text="End Break"
                onClick={() => onEndBreak(breakInfo.agentId, breakInfo.slotId)} // Pass agentId and slotId
                // Style the button to be less obtrusive or match Teams aesthetics
                // Example: iconProps={{ iconName: 'CheckMark' }} 
                styles={{
                  root: {
                    backgroundColor: '#4CAF50', // Green for end action
                    color: 'white',
                    borderColor: '#4CAF50',
                  },
                  rootHovered: {
                    backgroundColor: '#45a049',
                    color: 'white',
                    borderColor: '#45a049',
                  },
                  rootPressed: {
                    backgroundColor: '#3e8e41',
                    color: 'white',
                    borderColor: '#3e8e41',
                  }
                }}
              />
            </Stack>
          ))}
        </Stack>
      </Stack>
    </MessageBar>
  );
};

export default Banner; 