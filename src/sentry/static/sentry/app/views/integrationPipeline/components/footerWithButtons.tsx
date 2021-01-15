import React from 'react';
import styled from '@emotion/styled';

import Button from 'app/components/actions/button';
import {t} from 'app/locale';

type Props = {buttonText: string} & Pick<
  React.ComponentProps<typeof Button>,
  'disabled' | 'onClick'
>;

export default function FooterWithButtons({buttonText, ...rest}: Props) {
  return (
    <Footer>
      <ButtonWrapper>
        <StyledButton size="small">{t('View Docs')}</StyledButton>
        <StyledButton priority="primary" type="submit" size="small" {...rest}>
          {buttonText}
        </StyledButton>
      </ButtonWrapper>
    </Footer>
  );
}

//wrap in form so we can keep form submission behavior
const Footer = styled('form')`
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 60px;
  z-index: 100;
  background-color: ${p => p.theme.bodyBackground};
  border-top: 1px solid ${p => p.theme.gray100};
`;

const StyledButton = styled(Button)`
  padding: 0;
  margin-right: 20px;
`;

const ButtonWrapper = styled('div')`
  padding: 20px 0;
  float: right;
`;
