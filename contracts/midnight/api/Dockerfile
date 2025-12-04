FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Install tsx and typescript globally
RUN npm install -g tsx typescript

WORKDIR /app

# Environment variables (injected at runtime)
ENV MIDNIGHT_MNEMONIC="" \
    MIDNIGHT_ENVIRONMENT="testnet" \
    MIDNIGHT_PROOF_SERVER="http://127.0.0.1:6300" \
    MIDNIGHT_INDEXER="https://indexer.testnet-02.midnight.network/api/v1/graphql" \
    MIDNIGHT_INDEXER_WS="wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws" \
    MIDNIGHT_NODE="https://rpc.testnet-02.midnight.network" \
    PORT="8000"

# Copy Python code
COPY api/python ./python
RUN pip install --no-cache-dir -r python/requirements.txt

# Copy Node dependencies from root
COPY package.json package-lock.json ./
RUN npm install --unsafe-perm

# Copy ts code
COPY api/ts ./ts

EXPOSE 8000

CMD ["python", "python/main.py"]
