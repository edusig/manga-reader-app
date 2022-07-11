import styled from '@emotion/native';

export const PrimaryText = styled.Text`
  color: ${(props) => props.theme.palette.primaryText};
`;

export const SecondaryText = styled.Text`
  color: ${(props) => props.theme.palette.secondaryText};
`;

export const ModalOverlay = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  margin-top: 48px;
  background-color: '#FFFFFFAA';
`;

export const ModalDialog = styled.View`
  margin: 32px 16px;
  background-color: ${(props) => props.theme.palette.surface};
  border-radius: 8px;
  padding: 16px;
  align-items: center;
`;

export const EmptyText = styled.Text`
  font-size: 18px;
  padding-top: 12px;
  text-align: center;
`;
