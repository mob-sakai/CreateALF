ARG  UNITY_VERSION=${UNITY_VERSION}
FROM gableroux/unity3d:${UNITY_VERSION}

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]