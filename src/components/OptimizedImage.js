import React, { memo } from 'react';
import { Image } from 'react-native';
import { optimizeImageUrl } from '../utils/helpers';

const OptimizedImage = ({ source, width = 700, ...rest }) => {
  const uri = source?.uri ? optimizeImageUrl(source.uri, width) : undefined;

  return (
    <Image
      {...rest}
      source={uri ? { uri } : source}
      progressiveRenderingEnabled
      fadeDuration={150}
    />
  );
};

export default memo(OptimizedImage);
